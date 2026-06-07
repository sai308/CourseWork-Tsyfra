const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(verifyToken, requireRole('ADMIN'));

// ─── USERS ───────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/toggle-active  — block / unblock
router.patch('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    if (user.role === 'ADMIN') return res.status(403).json({ error: 'Неможливо заблокувати адміністратора' });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    if (user.role === 'ADMIN') return res.status(403).json({ error: 'Неможливо видалити адміністратора' });
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Користувача видалено' });
  } catch (err) { next(err); }
});

// ─── CATEGORIES ──────────────────────────────────────────
// GET /api/admin/categories
router.get('/categories', async (req, res, next) => {
  try {
    const cats = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(cats);
  } catch (err) { next(err); }
});

// POST /api/admin/categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "Назва та slug обов'язкові" });
    const existing = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing) return res.status(400).json({ error: 'Категорія з такою назвою або slug вже існує' });
    const cat = await prisma.category.create({ data: { name, slug } });
    return res.status(201).json(cat);
  } catch (err) { next(err); }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) return res.status(400).json({ error: `Неможливо видалити: категорія містить ${count} товарів` });
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Категорію видалено' });
  } catch (err) { next(err); }
});

// ─── REPORTS ─────────────────────────────────────────────
// GET /api/admin/reports
router.get('/reports', async (req, res, next) => {
  try {
    const [totalUsers, totalMakers, totalBuyers, totalProducts, totalOrders,
      pendingOrders, processingOrders, deliveredOrders, cancelledOrders,
      recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'MAKER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: { select: { id: true, name: true, makerId: true } } },
          },
        },
      }),
    ]);

    // Total revenue across all delivered orders
    const deliveredAll = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      include: { items: true },
    });
    let totalRevenue = 0;
    for (const o of deliveredAll) for (const i of o.items) totalRevenue += parseFloat(i.price) * i.quantity;

    return res.json({
      users: { total: totalUsers, makers: totalMakers, buyers: totalBuyers },
      products: totalProducts,
      orders: { total: totalOrders, pending: pendingOrders, processing: processingOrders, delivered: deliveredOrders, cancelled: cancelledOrders },
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      recentOrders,
    });
  } catch (err) { next(err); }
});

// ─── PRODUCT MODERATION ───────────────────────────────────
// GET /api/admin/products/pending
router.get('/products/pending', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'PENDING' },
      include: {
        category: { select: { id: true, name: true } },
        maker: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(products);
  } catch (err) { next(err); }
});

// PATCH /api/admin/products/:id/status
router.patch('/products/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Статус має бути APPROVED або REJECTED' });
    }
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, name: true, status: true },
    });
    return res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
