import express from 'express'; // Reloaded to sync upload fixes
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import utilRoutes from './routes/utilRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { initSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// 1. CORS Middleware (Must be at the top)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Security Middleware with Razorpay CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      "frame-src": ["'self'", "https://api.razorpay.com", "https://tds.razorpay.com"],
      "connect-src": ["'self'", "https://api.razorpay.com", "http://localhost:5000"],
      "img-src": ["'self'", "data:", "http://localhost:5000", "blob:"]
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // increased for development
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

connectDB();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/utils', utilRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reports', reportRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
