const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');

// Protect route — must be logged in
const protect = catchAsync(async (req, res, next) => {
  // 1. Get token from Authorization header
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // "Bearer <token>"
  }

  if (!token) {
    throw new AppError('You are not logged in. Please log in to get access.', 401);
  }

  // 2. Verify token (throws if expired or tampered)
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);

  // 3. Check if user still exists (might have been deleted after token was issued)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new AppError('The user belonging to this token no longer exists.', 401);
  }

  // 4. Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError('User recently changed password. Please log in again.', 401);
  }

  // 5. Grant access — attach user to request
  req.user = currentUser;
  next();
});

// Restrict to specific roles — use AFTER protect
// Usage: router.delete('/', protect, restrictTo('admin'), deleteUser)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }
    next();
  };
};

module.exports = { protect, restrictTo };