const express = require('express');
const Task        = require('../models/Task')
const AppError    = require('../utils/AppError')
const catchAsync  = require('../utils/catchAsync')
const router = express.Router({ mergeParams: true });
const {
  getAllTasks, getTask, createTask, updateTask, deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints (nested under projects)
 */

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, in-review, done]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: e.g. -createdAt or priority
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of tasks
 *   post:
 *     summary: Create a task in a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:          { type: string, example: Build login page }
 *               description:    { type: string }
 *               priority:       { type: string, enum: [low, medium, high, critical] }
 *               status:         { type: string, enum: [todo, in-progress, in-review, done] }
 *               estimatedHours: { type: number, example: 4 }
 *               assignee:       { type: string, example: 64f1234567890abcdef12345 }
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.route('/').get(getAllTasks).post(createTask);

/**
 * @swagger
 * /api/projects/{projectId}/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task data
 *       404:
 *         description: Task not found
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:    { type: string }
 *               status:   { type: string, enum: [todo, in-progress, in-review, done] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               assignee: { type: string }
 *     responses:
 *       200:
 *         description: Task updated
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);
// Add these routes at the bottom
router.post('/:id/comments', catchAsync(async (req, res, next) => {
  const { text } = req.body
  if (!text?.trim()) return next(new AppError('Comment text is required', 400))

  await Task.findOneAndUpdate(
    { _id: req.params.id, project: req.params.projectId },
    {
      $push: {
        comments: {
          $each: [{ user: req.user.id, text: text.trim() }],
          $position: 0,
        },
      },
    }
  )

  // Fetch fresh task with populated comments
  const task = await Task.findById(req.params.id)
    .populate('comments.user', 'name email avatar _id')

  if (!task) return next(new AppError('Task not found', 404))

  const { notifyProject } = require('../utils/notify')
  notifyProject(req.params.projectId, 'task:commented', {
    taskId:    task._id,
    taskTitle: task.title,
    projectId: req.params.projectId,
    by:        req.user.name,
  })

  res.status(201).json({ success: true, data: task.comments[0] })
}))

router.delete('/:id/comments/:commentId', catchAsync(async (req, res, next) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, project: req.params.projectId },
    { $pull: { comments: { _id: req.params.commentId } } },
    { new: true }
  )
  if (!task) return next(new AppError('Task not found', 404))
  res.status(200).json({ success: true, message: 'Comment deleted' })
}))
module.exports = router;