const crypto = require('crypto')
const User   = require('../models/User')
const AppError  = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const { sendTokens, verifyToken, generateAccessToken } = require('../utils/tokenUtils')
const {
  addWelcomeEmailJob,
  addVerificationEmailJob,
  addTaskAssignedEmailJob,
  addPasswordResetEmailJob,
} = require('../jobs/emailQueue')

// POST /api/auth/register
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) return next(new AppError('Email already in use', 409))

  const user = await User.create({ name, email, password })

  // Generate verification token
  const verifyToken = user.createEmailVerificationToken()
  await user.save({ validateBeforeSave: false })

  // Only send verification email — welcome email comes after verification
  await addVerificationEmailJob({ to: email, name, verifyToken })

  res.status(201).json({
    success: true,
    message: 'Account created! Please check your email to verify your account.',
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      isVerified: user.isVerified,
    },
  })
})

// POST /api/auth/login
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401))
  }

  // Block login if not verified
  if (!user.isVerified) {
    return next(new AppError('Please verify your email before logging in.', 401))
  }

  sendTokens(res, user, 200)
})

// GET /api/auth/verify-email?token=...
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.query

  if (!token) return next(new AppError('Verification token is required', 400))

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  const user = await User.findOne({
    emailVerificationToken:   hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  })

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }

  // Mark as verified
  user.isVerified               = true
  user.emailVerificationToken   = undefined
  user.emailVerificationExpires = undefined
  await user.save({ validateBeforeSave: false })

  // NOW send welcome email — user is verified
  await addWelcomeEmailJob({ to: user.email, name: user.name })

  // Redirect to frontend login with success message
  res.redirect('http://localhost:5173/login?verified=true')
})

// POST /api/auth/resend-verification
const resendVerification = catchAsync(async (req, res, next) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a verification link has been sent',
    })
  }

  if (user.isVerified) {
    return next(new AppError('Email is already verified', 400))
  }

  const verifyToken = user.createEmailVerificationToken()
  await user.save({ validateBeforeSave: false })

  await addVerificationEmailJob({
    to:          user.email,
    name:        user.name,
    verifyToken,
  })

  res.status(200).json({
    success: true,
    message: 'Verification email sent! Check your inbox.',
  })
})

// POST /api/auth/refresh
const refreshToken = catchAsync(async (req, res, next) => {
  const token = req.cookies.refreshToken
  if (!token) return next(new AppError('No refresh token provided', 401))

  const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET)
  const user    = await User.findById(decoded.id)
  if (!user) return next(new AppError('User not found', 401))

  const accessToken = generateAccessToken(user._id, user.role)
  res.status(200).json({ success: true, accessToken })
})

// POST /api/auth/logout
const logout = catchAsync(async (req, res) => {
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) })
  res.status(200).json({ success: true, message: 'Logged out successfully' })
})

// GET /api/auth/me
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({ success: true, user })
})

// PATCH /api/auth/change-password
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400))
  }

  const user = await User.findById(req.user.id).select('+password')
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401))
  }

  user.password          = newPassword
  user.passwordChangedAt = new Date()
  await user.save()

  res.status(200).json({ success: true, message: 'Password changed successfully' })
})

// POST /api/auth/forgot-password
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body
  if (!email) return next(new AppError('Please provide your email', 400))

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    })
  }

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  try {
    await addPasswordResetEmailJob({ to: user.email, name: user.name, resetToken })
  } catch (err) {
    user.passwordResetToken   = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return next(new AppError('Error sending email. Try again later.', 500))
  }

  res.status(200).json({
    success: true,
    message: 'If that email exists, a reset link has been sent',
  })
})

// POST /api/auth/reset-password
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return next(new AppError('Token and new password are required', 400))
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  if (!user) return next(new AppError('Token is invalid or has expired', 400))

  if (newPassword.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400))
  }

  user.password             = newPassword
  user.passwordResetToken   = undefined
  user.passwordResetExpires = undefined
  user.passwordChangedAt    = new Date()
  await user.save()

  sendTokens(res, user, 200)
})

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
}