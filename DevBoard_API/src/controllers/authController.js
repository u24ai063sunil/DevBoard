const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendTokens, verifyToken, generateAccessToken } = require('../utils/tokenUtils');
const { addWelcomeEmailJob } = require('../jobs/emailQueue');

// POST /api/auth/register
// const register = catchAsync(async (req, res, next) => {
//   const { name, email, password } = req.body;

//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     throw new AppError('Email already in use', 409);
//   }
//   const user = await User.create({ name, email, password });
//   sendTokens(res, user, 201);
// });
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already in use', 409));
    // throw new AppError('Email already in use', 409);
  }

  const user = await User.create({ name, email, password });

  // Add to queue — does not block the response
  await addWelcomeEmailJob({ to: email, name });

  sendTokens(res, user, 201);
});

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Get user WITH password (select: false means it's excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    // Same error message for both cases — don't reveal if email exists
    throw new AppError('Invalid email or password', 401);
  }

  sendTokens(res, user, 200);
});

// POST /api/auth/refresh
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new AppError('No refresh token provided', 401);
  }

  // Verify refresh token
  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Issue new access token
  const accessToken = generateAccessToken(user._id, user.role);

  res.status(200).json({ success: true, accessToken });
});

// POST /api/auth/logout
const logout = catchAsync(async (req, res, next) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0), // expire immediately
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me  (protected)
const getMe = catchAsync(async (req, res, next) => {
  // req.user is attached by the protect middleware
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, user });
});

module.exports = { register, login, refreshToken, logout, getMe };