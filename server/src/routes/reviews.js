const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

// GET /api/products/:productId/reviews
router.get('/', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return res.json({ reviews, avgRating: parseFloat(avgRating.toFixed(1)), count: reviews.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:productId/reviews
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оцінка має бути від 1 до 5' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Будь ласка, напишіть коментар до відгуку' });
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) {
      return res.status(404).json({ error: 'Товар не знайдено' });
    }

    // Check if user already reviewed
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: req.params.productId, userId: req.user.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Ви вже залишили відгук на цей товар' });
    }

    const review = await prisma.review.create({
      data: {
        productId: req.params.productId,
        userId: req.user.id,
        rating: parseInt(rating),
        comment: comment.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:productId/reviews/:reviewId
router.delete('/:reviewId', verifyToken, async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.reviewId } });
    if (!review) return res.status(404).json({ error: 'Відгук не знайдено' });
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Немає дозволу на видалення цього відгуку' });
    }
    await prisma.review.delete({ where: { id: req.params.reviewId } });
    return res.json({ message: 'Відгук видалено' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
