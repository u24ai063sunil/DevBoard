  // ← must be FIRST line
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const AppError = require('./utils/AppError');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();

// ── Security middleware ──────────────────────────────────────────
// helmet sets secure HTTP headers (prevents XSS, clickjacking etc.)
app.use(helmet());

// CORS — controls which origins can call your API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // allow cookies to be sent cross-origin
}));

// ── Rate limiting ─────────────────────────────────────────────────
// Global limiter: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, slow down.' },
});
app.use('/api', limiter);

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json());           // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(cookieParser());           // parse cookies (needed for refresh tokens)

// ── HTTP request logging ──────────────────────────────────────────
// Morgan logs: GET /api/users 200 12ms
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'DevBoard API Docs',
  customCss: '.swagger-ui .topbar { display: none }', // hide default swagger header
}));
app.use('/api/auth', authRoutes);
// (More routes added in later phases)
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes); // nested route
// ── 404 handler ───────────────────────────────────────────────────
app.use('/api', uploadRoutes);
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (always LAST middleware) ─────────────────
app.use((err, req, res, next) => {
  let error = { ...err, message: err.message };

  // Mongoose bad ObjectId → 404
  if (err.name === 'CastError') {
    error = new AppError(`Resource not found`, 404);
  }

  // Mongoose duplicate key (e.g. unique email) → 400
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(`${field} already exists`, 400);
  }

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Token expired', 401);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;