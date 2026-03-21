const jwt = require('jsonwebtoken');

// Generate a short-lived access token (holds user identity)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },                    // payload — what's inside the token
    process.env.JWT_ACCESS_SECRET,           // secret — used to sign + verify
    { expiresIn: process.env.JWT_ACCESS_EXPIRES } // expires in 15 minutes
  );
};

// Generate a long-lived refresh token (only used to get new access tokens)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES } // expires in 7 days
  );
};

// Verify a token — throws if invalid or expired
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

// Send both tokens: access token in JSON body, refresh token in HttpOnly cookie
const sendTokens = (res, user, statusCode) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // HttpOnly cookie — JS on the browser CANNOT read this (prevents XSS theft)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken, sendTokens };