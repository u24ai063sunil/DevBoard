const express = require('express');
const router = express.Router();
const {
  getAllProjects, getProject, createProject,
  updateProject, deleteProject, addMember,
} = require('../controllers/projectController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createProjectSchema, updateProjectSchema } = require('../validators/projectValidators');

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for logged-in user
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived, on-hold]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: Sort fields e.g. -createdAt,priority
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:     { type: boolean }
 *                 count:       { type: integer }
 *                 total:       { type: integer }
 *                 totalPages:  { type: integer }
 *                 currentPage: { type: integer }
 *                 fromCache:   { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: DevBoard App }
 *               description: { type: string, example: Main project }
 *               priority:    { type: string, enum: [low, medium, high] }
 *               status:      { type: string, enum: [active, completed, archived, on-hold] }
 *               tags:        { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 */
router.route('/')
  .get(getAllProjects)
  .post(validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project data with tasks
 *       404:
 *         description: Project not found
 *       403:
 *         description: No access to this project
 *   patch:
 *     summary: Update a project
 *     tags: [Projects]
 *     parameters:
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
 *               name:     { type: string }
 *               status:   { type: string, enum: [active, completed, archived, on-hold] }
 *               priority: { type: string, enum: [low, medium, high] }
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *   delete:
 *     summary: Delete a project and all its tasks
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       403:
 *         description: Only owner can delete
 */
router.route('/:id')
  .get(getProject)
  .patch(validate(updateProjectSchema), updateProject)
  .delete(deleteProject);

/**
 * @swagger
 * /api/projects/{id}/members:
 *   post:
 *     summary: Add a member to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, example: 64f1234567890abcdef12345 }
 *               role:   { type: string, enum: [viewer, editor, admin] }
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: User already a member
 */
router.post('/:id/members', addMember);

module.exports = router;