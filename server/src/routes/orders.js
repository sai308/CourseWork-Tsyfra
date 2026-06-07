const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
const prisma = new PrismaClient();

const ORDER_ITEMS_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          makerId: true,
        },
      },
    },
  },
};

// POST /api/orders
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required and must not be empty' });
    }

    // Validate and fetch product prices from DB
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have productId and quantity >= 1' });
      }
      if (!productMap.has(item.productId)) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
    }

    // Create order with server-fetched prices
    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        status: 'PENDING',
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId);
            return {
              productId: item.productId,
              quantity: parseInt(item.quantity),
              price: product.price,
            };
          }),
        },
      },
      include: {
        ...ORDER_ITEMS_INCLUDE,
        buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      include: ORDER_ITEMS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/maker
router.get('/maker', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              makerId: req.user.id,
            },
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                makerId: true,
              },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Статус є обов\'язковим' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_ITEMS_INCLUDE,
    });

    if (!order) {
      return res.status(404).json({ error: 'Замовлення не знайдено' });
    }

    const currentStatus = order.status;

    // Validate transitions
    const validTransitions = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed || !allowed.includes(status)) {
      const allowedUk = {
        PENDING: ['В обробці', 'Скасовано'],
        PROCESSING: ['Доставлено'],
        DELIVERED: [],
        CANCELLED: [],
      };
      const statusUk = { PENDING: 'Нове', PROCESSING: 'В обробці', DELIVERED: 'Доставлено', CANCELLED: 'Скасовано' };
      const allowedList = allowedUk[currentStatus]?.join(', ') || 'немає';
      return res.status(400).json({
        error: `Неможливо змінити статус «${statusUk[currentStatus]}». Дозволено: ${allowedList || 'жодних змін'}`,
      });
    }

    // PENDING → PROCESSING: check stock and decrement
    if (status === 'PROCESSING') {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Check stock for all items
        for (const item of order.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw Object.assign(new Error(`Товар не знайдено`), { status: 400 });
          }
          if (product.stock < item.quantity) {
            throw Object.assign(
              new Error(`Недостатня кількість товару на складі: «${product.name}»`),
              { status: 400 }
            );
          }
        }

        // Decrement stock for all items
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Update order status
        return tx.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
          include: {
            ...ORDER_ITEMS_INCLUDE,
            buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        });
      });

      return res.json({ order: updatedOrder });
    }

    // PROCESSING → DELIVERED
    if (status === 'DELIVERED') {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED', isArchived: true },
        include: {
          ...ORDER_ITEMS_INCLUDE,
          buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
      return res.json({ order: updatedOrder });
    }

    // PENDING → CANCELLED
    if (status === 'CANCELLED') {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
        include: {
          ...ORDER_ITEMS_INCLUDE,
          buyer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
      return res.json({ order: updatedOrder });
    }

    // Fallback (should not reach here)
    return res.status(400).json({ error: 'Невідомий перехід статусу' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
