const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'completed', 'archived', 'on-hold']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'completed', 'archived', 'on-hold']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

module.exports = { createProjectSchema, updateProjectSchema };