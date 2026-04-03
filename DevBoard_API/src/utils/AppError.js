class AppError extends Error {
  constructor(message, statusCode) {
    super(message);           // calls Error constructor, sets this.message
    this.statusCode = statusCode;
    this.isOperational = true; // our own known errors vs unexpected crashes

    Error.captureStackTrace(this, this.constructor); // cleaner stack trace
  }
}

module.exports = AppError;