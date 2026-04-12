const express    = require('express')
const router     = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const adminOnly   = require('../middlewares/adminMiddleware')
const catchAsync  = require('../utils/catchAsync')
const AppError    = require('../utils/AppError')
const User        = require('../models/User')
const Project     = require('../models/Project')
const Task        = require('../models/Task')

// All admin routes require auth + admin role
router.use(protect)
router.use(adminOnly)

// GET /api/admin/stats — system overview
router.get('/stats', catchAsync(async (req, res) => {
  const [
    totalUsers,
    verifiedUsers,
    googleUsers,
    bannedUsers,
    totalProjects,
    totalTasks,
    doneTasks,
    todayUsers,
    todayProjects,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ googleId: { $exists: true } }),
    User.countDocuments({ isBanned: true }),
    Project.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: 'done' }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    Project.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
  ])

  res.status(200).json({
    success: true,
    data: {
      users:    { total: totalUsers, verified: verifiedUsers, google: googleUsers, banned: bannedUsers, today: todayUsers },
      projects: { total: totalProjects, today: todayProjects },
      tasks:    { total: totalTasks, done: doneTasks, completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
    },
  })
}))

// GET /api/admin/users — list all users with pagination
router.get('/users', catchAsync(async (req, res) => {
  const page   = parseInt(req.query.page)  || 1
  const limit  = parseInt(req.query.limit) || 10
  const search = req.query.search || ''
  const skip   = (page - 1) * limit

  const filter = search
    ? {
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    data: users,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  })
}))

// GET /api/admin/users/:id — single user detail
router.get('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -emailVerificationToken -passwordResetToken')

  if (!user) return next(new AppError('User not found', 404))

  const [projectCount, taskCount] = await Promise.all([
    Project.countDocuments({ owner: user._id }),
    Task.countDocuments({ createdBy: user._id }),
  ])

  res.status(200).json({
    success: true,
    data: { ...user.toObject(), projectCount, taskCount },
  })
}))

// PATCH /api/admin/users/:id/ban — ban user
router.patch('/users/:id/ban', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found', 404))

  if (user.role === 'admin') {
    return next(new AppError('Cannot ban an admin user', 400))
  }

  user.isBanned  = true
  user.bannedAt  = new Date()
  user.bannedBy  = req.user.id
  await user.save({ validateBeforeSave: false })

  res.status(200).json({ success: true, message: `${user.name} has been banned` })
}))

// PATCH /api/admin/users/:id/unban — unban user
router.patch('/users/:id/unban', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found', 404))

  user.isBanned = false
  user.bannedAt = undefined
  user.bannedBy = undefined
  await user.save({ validateBeforeSave: false })

  res.status(200).json({ success: true, message: `${user.name} has been unbanned` })
}))

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', catchAsync(async (req, res, next) => {
  const { role } = req.body
  if (!['user', 'admin'].includes(role)) {
    return next(new AppError('Invalid role', 400))
  }

  // Prevent self-demotion
  if (req.params.id === req.user.id) {
    return next(new AppError('Cannot change your own role', 400))
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password')

  if (!user) return next(new AppError('User not found', 404))

  res.status(200).json({ success: true, data: user, message: `Role updated to ${role}` })
}))

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', catchAsync(async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return next(new AppError('Cannot delete your own account', 400))
  }

  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found', 404))

  // Delete user's projects + tasks
  const projects = await Project.find({ owner: user._id })
  for (const project of projects) {
    await Task.deleteMany({ project: project._id })
  }
  await Project.deleteMany({ owner: user._id })
  await user.deleteOne()

  res.status(200).json({ success: true, message: `${user.name} and all their data deleted` })
}))

// GET /api/admin/projects — all projects
router.get('/projects', catchAsync(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1
  const limit = parseInt(req.query.limit) || 10
  const skip  = (page - 1) * limit

  const [projects, total] = await Promise.all([
    Project.find()
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(),
  ])

  res.status(200).json({
    success: true,
    data: projects,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  })
}))

module.exports = router