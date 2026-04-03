require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Start email worker
require('./jobs/emailWorker');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info('Email worker started');
  });
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

startServer();