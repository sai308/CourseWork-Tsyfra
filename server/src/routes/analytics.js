const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/analytics/dashboard — combined stats + revenue for maker dashboard
router.get('/dashboard', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const makerId = req.user.id;
    const orderWhere = { items: { some: { product: { makerId } } } };

    const [totalProducts, totalOrders, pendingOrders, deliveredOrders] = await Promise.all([
      prisma.product.count({ where: { makerId } }),
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, status: 'PENDING' } }),
      prisma.order.findMany({
        where: { ...orderWhere, status: 'DELIVERED' },
        include: { items: { include: { product: { select: { id: true, makerId: true } } } } },
      }),
    ]);

    let totalRevenue = 0;
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        if (item.product.makerId === makerId) {
          totalRevenue += parseFloat(item.price) * item.quantity;
        }
      }
    }

    return res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders: deliveredOrders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/revenue
router.get('/revenue', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const makerId = req.user.id;
    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'DELIVERED', items: { some: { product: { makerId } } } },
      include: { items: { include: { product: { select: { id: true, name: true, makerId: true } } } } },
    });

    let totalRevenue = 0;
    const productStats = new Map();

    for (const order of deliveredOrders) {
      for (const item of order.items) {
        if (item.product.makerId !== makerId) continue;
        const itemRevenue = parseFloat(item.price) * item.quantity;
        totalRevenue += itemRevenue;
        const existing = productStats.get(item.productId) || { name: item.product.name, totalSold: 0, totalRevenue: 0 };
        existing.totalSold += item.quantity;
        existing.totalRevenue += itemRevenue;
        productStats.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((p) => ({ name: p.name, totalSold: p.totalSold, totalRevenue: parseFloat(p.totalRevenue.toFixed(2)) }));

    return res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      deliveredOrdersCount: deliveredOrders.length,
      topProducts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/stats
router.get('/stats', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const makerId = req.user.id;
    const orderWhere = { items: { some: { product: { makerId } } } };
    const totalProducts = await prisma.product.count({ where: { makerId } });
    const [totalOrders, pendingOrders, processingOrders, deliveredOrders] = await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, status: 'PENDING' } }),
      prisma.order.count({ where: { ...orderWhere, status: 'PROCESSING' } }),
      prisma.order.count({ where: { ...orderWhere, status: 'DELIVERED' } }),
    ]);
    return res.json({ totalProducts, totalOrders, pendingOrders, processingOrders, deliveredOrders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
