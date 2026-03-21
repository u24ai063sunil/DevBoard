const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

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

// (More routes added in later phases)

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (always LAST middleware) ─────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;