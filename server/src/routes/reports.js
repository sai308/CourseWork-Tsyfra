const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const REASONS = [
  'Шахрайство або обман',
  'Неправдива інформація про товар',
  'Образливий або невідповідний контент',
  'Порушення правил майданчика',
  'Підозрілий продавець',
  'Інше',
];

// POST /api/reports — create a report
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description, productId } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: "Вкажіть тип, ціль та причину скарги" });
    }
    if (!['product', 'user'].includes(targetType)) {
      return res.status(400).json({ error: 'Невірний тип скарги' });
    }
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Невірна причина скарги' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        targetType,
        targetId,
        reason,
        description: description?.trim() || null,
        productId: targetType === 'product' ? targetId : null,
      },
    });

    return res.status(201).json({ report, message: 'Скаргу надіслано. Дякуємо, ми розглянемо її найближчим часом.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports — admin only
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ заборонено' });
    }
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reports);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id/status — admin resolves/dismisses
router.patch('/:id/status', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ заборонено' });
    }
    const { status } = req.body;
    if (!['OPEN', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Невірний статус' });
    }
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = { router, REASONS };
