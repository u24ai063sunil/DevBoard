// Wraps async route handlers so we don't need try/catch in every controller
const catchAsync = (fn) => {
  return (req, res, next) => {
    const handler = async () => fn(req, res, next);

    Promise.resolve()
      .then(handler)
      .catch((err) => {
        if (typeof next === 'function') {
          return next(err);
        }
        // Fallback: this should not happen in normal Express flow,
        // but prevents `next is not a function` from crashing with 500.
        console.error('catchAsync middleware received invalid next:', err);
        res.status(500).json({
          success: false,
          message: err.message || 'Internal Server Error',
        });
      });
  };
};

module.exports = catchAsync;