const express    = require('express')
const router     = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const catchAsync  = require('../utils/catchAsync')
const Project     = require('../models/Project')
const Task        = require('../models/Task')
const User        = require('../models/User')

// GET /api/analytics/overview
router.get('/overview', protect, catchAsync(async (req, res) => {
  const userId = req.user.id

  // Projects where user is owner or member
  const projectFilter = {
    $or: [{ owner: userId }, { 'members.user': userId }],
  }

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    doneTasks,
    inProgressTasks,
    overdueTasks,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: 'active' }),
    Project.countDocuments({ ...projectFilter, status: 'completed' }),
    Task.countDocuments({ project: { $in: await Project.find(projectFilter).distinct('_id') } }),
    Task.countDocuments({ project: { $in: await Project.find(projectFilter).distinct('_id') }, status: 'done' }),
    Task.countDocuments({ project: { $in: await Project.find(projectFilter).distinct('_id') }, status: 'in-progress' }),
    Task.countDocuments({
      project: { $in: await Project.find(projectFilter).distinct('_id') },
      dueDate: { $lt: new Date() },
      status:  { $ne: 'done' },
    }),
  ])

  res.status(200).json({
    success: true,
    data: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: totalTasks > 0
        ? Math.round((doneTasks / totalTasks) * 100)
        : 0,
    },
  })
}))

// GET /api/analytics/tasks-by-status
router.get('/tasks-by-status', protect, catchAsync(async (req, res) => {
  const userId = req.user.id
  const projectIds = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).distinct('_id')

  const data = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  const formatted = data.map((d) => ({
    name:  d._id.replace('-', ' '),
    value: d.count,
    status: d._id,
  }))

  res.status(200).json({ success: true, data: formatted })
}))

// GET /api/analytics/tasks-by-priority
router.get('/tasks-by-priority', protect, catchAsync(async (req, res) => {
  const userId = req.user.id
  const projectIds = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).distinct('_id')

  const data = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])

  const formatted = data.map((d) => ({
    name:  d._id,
    value: d.count,
  }))

  res.status(200).json({ success: true, data: formatted })
}))

// GET /api/analytics/tasks-completed-over-time
router.get('/tasks-over-time', protect, catchAsync(async (req, res) => {
  const userId = req.user.id
  const projectIds = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).distinct('_id')

  // Last 7 days
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    days.push(date)
  }

  const data = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day)
      nextDay.setDate(nextDay.getDate() + 1)

      const completed = await Task.countDocuments({
        project:     { $in: projectIds },
        status:      'done',
        completedAt: { $gte: day, $lt: nextDay },
      })

      const created = await Task.countDocuments({
        project:   { $in: projectIds },
        createdAt: { $gte: day, $lt: nextDay },
      })

      return {
        date: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        completed,
        created,
      }
    })
  )

  res.status(200).json({ success: true, data })
}))

// GET /api/analytics/project-progress
router.get('/project-progress', protect, catchAsync(async (req, res) => {
  const userId = req.user.id

  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).select('name status').limit(6)

  const data = await Promise.all(
    projects.map(async (project) => {
      const total = await Task.countDocuments({ project: project._id })
      const done  = await Task.countDocuments({ project: project._id, status: 'done' })

      return {
        name:     project.name.length > 12
          ? project.name.substring(0, 12) + '...'
          : project.name,
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      }
    })
  )

  res.status(200).json({ success: true, data })
}))

module.exports = router