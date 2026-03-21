// Wraps async route handlers so we don't need try/catch in every controller
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // .catch(next) sends error to global handler
  };
};

module.exports = catchAsync;