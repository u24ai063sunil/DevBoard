const { z } = require('zod');
const AppError = require('../utils/AppError');

// Middleware factory — takes a Zod schema, returns a middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    // Format Zod errors into a readable message
    const message = err.errors.map((e) => `${e.path.slice(1).join('.')}: ${e.message}`).join(', ');
    throw new AppError(message, 400);
  }
};

module.exports = validate;