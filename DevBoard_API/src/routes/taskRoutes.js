const express = require('express');
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

module.exports = router;