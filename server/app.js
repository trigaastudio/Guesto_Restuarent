import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import qs from 'qs';
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
import tableRoutes from './routes/tableRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import compression from 'compression';
import { initSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(compression({ threshold: 1024 }));



app.set('trust proxy', 1);

app.set('query parser', function (str) {
  return qs.parse(str, {
    parameterLimit: 100,
    depth: 2,
    arrayLimit: 100
  });
});


const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));




app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://checkout.razorpay.com"],
      "frame-src": ["'self'", "https://api.razorpay.com", "https://tds.razorpay.com"],
      "connect-src": [
        "'self'",
        "https://api.razorpay.com",
        process.env.NODE_ENV === 'production'
          ? process.env.BACKEND_URL || ''
          : "http://localhost:5000"
      ].filter(Boolean),
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));


const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

connectDB();


app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());



app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});

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
app.use('/api/tables', tableRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});


app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: isDev ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export default app;
