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
const addPasswordResetEmailJob = async (resetData) => {
  await emailQueue.add('password-reset-email', resetData)
}
const addVerificationEmailJob = async (data) => {
  await emailQueue.add('verification-email', data, { delay: 500 })
}

module.exports = {
  emailQueue,
  addWelcomeEmailJob,
  addVerificationEmailJob,
  addTaskAssignedEmailJob,
  addPasswordResetEmailJob,
}