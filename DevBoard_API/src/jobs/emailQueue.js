const { Queue } = require('bullmq');
const redis = require('../config/redis');

const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

const addWelcomeEmailJob = async (userData) => {
  await emailQueue.add('welcome-email', userData, {
    delay: 1000,
  });
};

const addTaskAssignedEmailJob = async (taskData) => {
  await emailQueue.add('task-assigned-email', taskData);
};

module.exports = { emailQueue, addWelcomeEmailJob, addTaskAssignedEmailJob };