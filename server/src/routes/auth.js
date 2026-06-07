const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
};

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Будь ласка, заповніть всі поля: ім'я, email та пароль" });
    }
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Невірний формат email' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Пароль повинен містити мінімум 6 символів' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Цей email вже використовується. Спробуйте увійти або вкажіть інший email' });
    }

    const allowedRoles = ['BUYER', 'MAKER'];
    const userRole = allowedRoles.includes(role) ? role : 'BUYER';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: userRole },
      select: USER_SELECT,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Будь ласка, вкажіть email та пароль' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Невірна електронна пошта або пароль' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Ваш акаунт заблоковано. Зверніться до адміністратора' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Невірна електронна пошта або пароль' });
    }

    const { password: _pw, ...userWithoutPassword } = user;
    const token = signToken(userWithoutPassword);
    return res.json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT,
    });
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    return res.json(user);  // Return user directly (not wrapped in { user: {} })
  } catch (err) {
    next(err);
  }
});

module.exports = router;
