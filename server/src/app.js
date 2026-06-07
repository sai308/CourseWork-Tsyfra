require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const { router: reportRoutes } = require('./routes/reports');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
// Increase body size limit to 10MB to handle base64 image uploads
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// Reviews nested under products
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Внутрішня помилка сервера' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`HANDMADE server running on port ${PORT}`));

module.exports = app;
