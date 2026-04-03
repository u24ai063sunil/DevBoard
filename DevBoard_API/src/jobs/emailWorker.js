const { Worker } = require('bullmq');
const redis = require('../config/redis');
const { sendWelcomeEmail, sendTaskAssignedEmail } = require('../utils/email');
const logger = require('../utils/logger');

const emailWorker = new Worker(
  'email',
  async (job) => {
    logger.info(`Processing job: ${job.name} [ID: ${job.id}]`);

    switch (job.name) {
      case 'welcome-email':
        await sendWelcomeEmail(job.data);
        break;

      case 'task-assigned-email':
        await sendTaskAssignedEmail(job.data);
        break;

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }

    logger.info(`Job completed: ${job.name} [ID: ${job.id}]`);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email sent — Job: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email failed — Job: ${job.id} — ${err.message}`);
});

module.exports = emailWorker;