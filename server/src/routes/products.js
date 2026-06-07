const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { requireOwnerOrAdmin, requireRole } = require('../middleware/rbac');

const router = express.Router();
const prisma = new PrismaClient();

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  maker: { select: { id: true, name: true, avatarUrl: true } },
};

// GET /api/products/categories — MUST be before /:id
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/my — maker's own products, MUST be before /:id
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { makerId: req.user.id },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { search, categoryIds, minPrice, maxPrice } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    const where = {};

    if (search && typeof search === 'string' && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    if (categoryIds && typeof categoryIds === 'string' && categoryIds.trim()) {
      const ids = categoryIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        where.categoryId = { in: ids };
      }
    }

    const priceFilter = {};
    if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
      priceFilter.gte = parseFloat(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
      priceFilter.lte = parseFloat(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    // Public catalog only shows APPROVED products
    where.status = 'APPROVED';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: PRODUCT_INCLUDE,
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', verifyToken, requireRole('MAKER', 'ADMIN'), async (req, res, next) => {
  try {
    const { name, description, price, stock, imageUrl, categoryId } = req.body;

    if (!name || !description || price === undefined || !categoryId) {
      return res.status(400).json({ error: "Заповніть обов'язкові поля: назва, опис, ціна та категорія" });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ error: 'Категорію не знайдено. Оберіть категорію зі списку' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: stock !== undefined ? parseInt(stock) : 0,
        imageUrl: imageUrl || null,
        makerId: req.user.id,
        categoryId,
      },
      include: PRODUCT_INCLUDE,
    });

    return res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put(
  '/:id',
  verifyToken,
  requireOwnerOrAdmin('product'),
  async (req, res, next) => {
    try {
      const { name, description, price, stock, imageUrl, categoryId } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (categoryId !== undefined) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) {
          return res.status(400).json({ error: 'Category not found' });
        }
        updateData.categoryId = categoryId;
      }

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: updateData,
        include: PRODUCT_INCLUDE,
      });

      return res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id
router.delete(
  '/:id',
  verifyToken,
  requireOwnerOrAdmin('product'),
  async (req, res, next) => {
    try {
      // Check if product is part of any orders
      const orderCount = await prisma.orderItem.count({ where: { productId: req.params.id } });
      if (orderCount > 0) {
        return res.status(400).json({
          error: `Неможливо видалити товар, бо він входить до складу ${orderCount} замовлень. Спочатку зменшить кількість до 0.`,
        });
      }
      await prisma.product.delete({ where: { id: req.params.id } });
      return res.json({ message: 'Товар видалено' });
    } catch (err) {
      // Catch foreign key constraint errors from DB
      if (err.code === 'P2003' || (err.message && err.message.includes('foreign key'))) {
        return res.status(400).json({
          error: `Неможливо видалити товар — він пов’язаний з існуючими замовленнями.`,
        });
      }
      next(err);
    }
  }
);

// PATCH /api/products/:id  — edit product (owner or admin)
router.patch(
  '/:id',
  verifyToken,
  requireOwnerOrAdmin('product'),
  async (req, res, next) => {
    try {
      const { name, description, price, stock, categoryId, imageUrl } = req.body;
      const data = {};
      if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ error: 'Назва не може бути порожньою' });
        data.name = name.trim();
      }
      if (description !== undefined) data.description = description.trim();
      if (price !== undefined) {
        const p = parseFloat(price);
        if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'Невірна ціна' });
        data.price = p;
      }
      if (stock !== undefined) {
        const s = parseInt(stock);
        if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Невірна кількість' });
        data.stock = s;
      }
      if (categoryId !== undefined) data.categoryId = categoryId;
      if (imageUrl !== undefined) data.imageUrl = imageUrl;

      const updated = await prisma.product.update({
        where: { id: req.params.id },
        data,
        include: { category: { select: { id: true, name: true } } },
      });
      return res.json({ product: updated, message: 'Товар оновлено' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
