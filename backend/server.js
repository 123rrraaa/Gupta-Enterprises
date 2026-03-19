const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/product');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payment');
const aiRoutes = require('./routes/ai');
const mongoose = require('mongoose')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'https://gupta-enterprises.netlify.app'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('Setting up routes...');
app.use('/products', productRoutes);
app.use('/admins', adminRoutes);
app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/upload', uploadRoutes);
app.use('/payment', paymentRoutes);
app.use('/ai', aiRoutes);

// Use env var if present; encode special chars in password if hard-coded
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://rajpatil8837_db_user:Rajpatil%401234@ge.ta4ul19.mongodb.net/myDB?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message || err);
  });

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});