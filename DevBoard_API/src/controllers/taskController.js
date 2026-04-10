const Task    = require('../models/Task')
const Project = require('../models/Project')
const User     = require('../models/User')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const ApiFeatures = require('../utils/ApiFeatures')
const { addTaskAssignedEmailJob } = require('../jobs/emailQueue')
const logger  = require('../utils/logger')
const { notifyUser, notifyProject, NOTIFICATION_TYPES } = require('../utils/notify')

// Helper: check if user has access to the project
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError('Project not found', 404);

  const isOwner = project.owner.toString() === userId;
  const isMember = project.members.some((m) => m.user.toString() === userId);

  if (!isOwner && !isMember) {
    throw new AppError('You do not have access to this project', 403);
  }
  return project;
};

// GET /api/projects/:projectId/tasks
const getAllTasks = catchAsync(async (req, res) => {
  await checkProjectAccess(req.params.projectId, req.user.id);

  const baseQuery = Task.find({ project: req.params.projectId });

  const features = new ApiFeatures(baseQuery, req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await features.query
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email');

  const total = await Task.countDocuments({ project: req.params.projectId });

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    totalPages: Math.ceil(total / (features.limit || 10)),
    currentPage: features.page || 1,
    data: tasks,
  });
});

// GET /api/projects/:projectId/tasks/:id
const getTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id)

  const task = await Task.findOne({
    _id:     req.params.id,
    project: req.params.projectId,
  })
    .populate('assignee',       'name email avatar')
    .populate('createdBy',      'name email')
    .populate('comments.user',  'name email avatar _id')  // ← add this
    .populate('activity.user',  'name email avatar')      // ← add this

  if (!task) return next(new AppError('Task not found', 404))

  res.status(200).json({ success: true, data: task })
})

// POST /api/projects/:projectId/tasks
const createTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id)

  const task = await Task.create({
    ...req.body,
    project:   req.params.projectId,
    createdBy: req.user.id,
  })

  // Notify assignee in real-time
  if (task.assignee && task.assignee.toString() !== req.user.id) {
    try {
      const assignee = await User.findById(task.assignee).select('name email')
      const project  = await Project.findById(req.params.projectId)

      if (assignee) {
        // Real-time notification
        notifyUser(task.assignee.toString(), NOTIFICATION_TYPES.TASK_ASSIGNED, {
          taskId:      task._id,
          taskTitle:   task.title,
          projectId:   req.params.projectId,
          projectName: project.name,
          assignedBy:  req.user.name || 'Someone',
          message:     `You were assigned "${task.title}" in ${project.name}`,
        })

        // Email notification
        await addTaskAssignedEmailJob({
          to:           assignee.email,
          assigneeName: assignee.name,
          taskTitle:    task.title,
          projectName:  project.name,
        })
      }
    } catch (err) {
      logger.error(`Notification error: ${err.message}`)
    }
  }

  // Notify all project members about new task
  notifyProject(req.params.projectId, NOTIFICATION_TYPES.TASK_UPDATED, {
    action:    'created',
    taskId:    task._id,
    taskTitle: task.title,
    by:        req.user.name || 'A team member',
  })

  res.status(201).json({ success: true, data: task })
})

// PATCH /api/projects/:projectId/tasks/:id
const updateTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id)

  const oldTask = await Task.findById(req.params.id)
  if (!oldTask) return next(new AppError('Task not found', 404))

  // Log what changed
  const activityLogs = []
  if (req.body.status && req.body.status !== oldTask.status) {
    activityLogs.push({ action: 'changed status', field: 'status', oldValue: oldTask.status, newValue: req.body.status })
  }
  if (req.body.priority && req.body.priority !== oldTask.priority) {
    activityLogs.push({ action: 'changed priority', field: 'priority', oldValue: oldTask.priority, newValue: req.body.priority })
  }
  if (req.body.assignee && req.body.assignee !== oldTask.assignee?.toString()) {
    activityLogs.push({ action: 'changed assignee', field: 'assignee', oldValue: oldTask.assignee, newValue: req.body.assignee })
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, project: req.params.projectId },
    req.body,
    { new: true, runValidators: true }
  )
  .populate('assignee', 'name email')
  .populate('createdBy', 'name email')

  if (!task) return next(new AppError('Task not found', 404))

  // Add activity logs
  activityLogs.forEach(({ action, field, oldValue, newValue }) => {
    logActivity(task, req.user.id, action, field, oldValue, newValue)
  })
  await task.save()

  // Notify assignee if changed
  const assigneeChanged = req.body.assignee &&
    req.body.assignee !== oldTask.assignee?.toString()

  if (assigneeChanged && task.assignee) {
    const isAssigningToSelf = task.assignee._id.toString() === req.user.id
    if (!isAssigningToSelf) {
      const project = await Project.findById(req.params.projectId)
      notifyUser(task.assignee._id.toString(), NOTIFICATION_TYPES.TASK_ASSIGNED, {
        taskId:      task._id,
        taskTitle:   task.title,
        projectId:   req.params.projectId,
        projectName: project.name,
        message:     `You were assigned "${task.title}" in ${project.name}`,
      })
      try {
        await addTaskAssignedEmailJob({
          to:           task.assignee.email,
          assigneeName: task.assignee.name,
          taskTitle:    task.title,
          projectName:  project.name,
        })
      } catch (err) {
        logger.error(`Email queue error: ${err.message}`)
      }
    }
  }

  if (req.body.status === 'done' && oldTask.status !== 'done') {
    notifyProject(req.params.projectId, NOTIFICATION_TYPES.TASK_COMPLETED, {
      taskId:    task._id,
      taskTitle: task.title,
      by:        req.user.name || 'A team member',
      message:   `"${task.title}" was marked as done`,
    })
  }

  notifyProject(req.params.projectId, NOTIFICATION_TYPES.TASK_UPDATED, {
    action:    'updated',
    taskId:    task._id,
    taskTitle: task.title,
    projectId: req.params.projectId,
  })

  res.status(200).json({ success: true, data: task })
})

// DELETE /api/projects/:projectId/tasks/:id
const deleteTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id);

  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    project: req.params.projectId,
  });

  if (!task) throw new AppError('Task not found', 404);

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});
// Helper to log activity
const logActivity = (task, userId, action, field, oldValue, newValue) => {
  task.activity.unshift({
    user:     userId,
    action,
    field,
    oldValue: oldValue?.toString(),
    newValue: newValue?.toString(),
    createdAt: new Date(),
  })
  // Keep only last 20 activities
  if (task.activity.length > 20) task.activity = task.activity.slice(0, 20)
}
module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask, logActivity };