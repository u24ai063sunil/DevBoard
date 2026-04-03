const Project = require('../models/Project');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');

// GET /api/projects
const getAllProjects = catchAsync(async (req, res) => {
  // Only show projects the user owns OR is a member of
  const baseQuery = Project.find({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id },
    ],
  });

  const features = new ApiFeatures(baseQuery, req.query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();

  const projects = await features.query.populate('owner', 'name email avatar');

  // Count total for pagination metadata
  const total = await Project.countDocuments({
    $or: [{ owner: req.user.id }, { 'members.user': req.user.id }],
  });

  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    totalPages: Math.ceil(total / (features.limit || 10)),
    currentPage: features.page || 1,
    data: projects,
  });
});

// GET /api/projects/:id
const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate({
      path: 'tasks',        // virtual field
      select: 'title status priority assignee dueDate',
      populate: { path: 'assignee', select: 'name avatar' },
    });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check if user has access
  const isOwner = project.owner._id.toString() === req.user.id;
  const isMember = project.members.some(
    (m) => m.user._id.toString() === req.user.id
  );

  if (!isOwner && !isMember) {
    throw new AppError('You do not have access to this project', 403);
  }

  res.status(200).json({ success: true, data: project });
});

// POST /api/projects
const createProject = catchAsync(async (req, res) => {
  // Automatically set the owner to the logged-in user
  const project = await Project.create({
    ...req.body,
    owner: req.user.id,
  });

  res.status(201).json({ success: true, data: project });
});

// PATCH /api/projects/:id
const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);

  // Only owner or admin member can update
  const isOwner = project.owner.toString() === req.user.id;
  const isAdmin = project.members.some(
    (m) => m.user.toString() === req.user.id && m.role === 'admin'
  );

  if (!isOwner && !isAdmin) {
    throw new AppError('Only the project owner can update this project', 403);
  }

  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,           // return updated document
      runValidators: true, // run schema validators on update
    }
  );

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/projects/:id
const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);

  // Only owner can delete
  if (project.owner.toString() !== req.user.id) {
    throw new AppError('Only the project owner can delete this project', 403);
  }

  // Delete all tasks belonging to this project first
  await Task.deleteMany({ project: req.params.id });

  await project.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Project and all its tasks deleted successfully',
  });
});

// POST /api/projects/:id/members
const addMember = catchAsync(async (req, res, next) => {
  const { userId, role } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) throw new AppError('Project not found', 404);

  if (project.owner.toString() !== req.user.id) {
    throw new AppError('Only the owner can add members', 403);
  }

  // Check if already a member
  const alreadyMember = project.members.some(
    (m) => m.user.toString() === userId
  );
  if (alreadyMember) {
    return next(new AppError('User is already a member', 400));
  }

  project.members.push({ user: userId, role: role || 'viewer' });
  await project.save();

  res.status(200).json({ success: true, data: project });
});

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
};