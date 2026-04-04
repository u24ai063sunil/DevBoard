const Task    = require('../models/Task')
const Project = require('../models/Project')
const User     = require('../models/User')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const ApiFeatures = require('../utils/ApiFeatures')
const { addTaskAssignedEmailJob } = require('../jobs/emailQueue')
const logger  = require('../utils/logger')

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
  await checkProjectAccess(req.params.projectId, req.user.id);

  const task = await Task.findOne({
    _id: req.params.id,
    project: req.params.projectId, // ensures task belongs to this project
  })
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email');

  if (!task) throw new AppError('Task not found', 404);

  res.status(200).json({ success: true, data: task });
});

// POST /api/projects/:projectId/tasks
const createTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id)

  const task = await Task.create({
    ...req.body,
    project:   req.params.projectId,
    createdBy: req.user.id,
  })

  // Send email if task is assigned to someone else on creation
  if (task.assignee && task.assignee.toString() !== req.user.id) {
    try {
      const assignee = await User.findById(task.assignee).select('name email')
      const project  = await Project.findById(req.params.projectId)

      if (assignee) {
        await addTaskAssignedEmailJob({
          to:           assignee.email,
          assigneeName: assignee.name,
          taskTitle:    task.title,
          projectName:  project.name,
        })
      }
    } catch (err) {
    }
  }

  res.status(201).json({ success: true, data: task })
})

// PATCH /api/projects/:projectId/tasks/:id
const updateTask = catchAsync(async (req, res, next) => {
  await checkProjectAccess(req.params.projectId, req.user.id)

  const oldTask = await Task.findById(req.params.id)
  if (!oldTask) return next(new AppError('Task not found', 404))

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, project: req.params.projectId },
    req.body,
    { new: true, runValidators: true }
  )
  .populate('assignee', 'name email')
  .populate('createdBy', 'name email')

  if (!task) return next(new AppError('Task not found', 404))

  const assigneeChanged = req.body.assignee &&
    req.body.assignee !== oldTask.assignee?.toString()

  if (assigneeChanged && task.assignee) {
    const isAssigningToSelf = task.assignee._id.toString() === req.user.id

    if (!isAssigningToSelf) {
      try {
        const project = await Project.findById(req.params.projectId)

        await addTaskAssignedEmailJob({
          to:           task.assignee.email,
          assigneeName: task.assignee.name,
          taskTitle:    task.title,
          projectName:  project.name,
        })
      } catch (err) {
      }
    }
  }

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

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };