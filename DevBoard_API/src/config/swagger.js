const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevBoard API',
      version: '1.0.0',
      description: 'Project & Task Management REST API built with MERN stack',
      contact: {
        name: 'DevBoard Support',
        email: 'support@devboard.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '64f1234567890abcdef12345' },
            name:      { type: 'string', example: 'Raj Patel' },
            email:     { type: 'string', example: 'raj@test.com' },
            role:      { type: 'string', enum: ['user', 'admin'] },
            avatar:    { type: 'string', example: 'https://cloudinary.com/...' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string', example: 'DevBoard App' },
            description: { type: 'string', example: 'Main project' },
            status:      { type: 'string', enum: ['active', 'completed', 'archived', 'on-hold'] },
            priority:    { type: 'string', enum: ['low', 'medium', 'high'] },
            owner:       { $ref: '#/components/schemas/User' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id:            { type: 'string' },
            title:          { type: 'string', example: 'Build login page' },
            description:    { type: 'string' },
            status:         { type: 'string', enum: ['todo', 'in-progress', 'in-review', 'done'] },
            priority:       { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            project:        { type: 'string', example: '64f1234567890abcdef12345' },
            assignee:       { $ref: '#/components/schemas/User' },
            estimatedHours: { type: 'number', example: 4 },
            createdAt:      { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message here' },
          },
        },
      },
    },
    // Apply Bearer auth globally to all routes
    security: [{ bearerAuth: [] }],
  },
  // Where to look for JSDoc comments
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;