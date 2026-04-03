const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendWelcomeEmail = async ({ to, name }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"DevBoard" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Welcome to DevBoard!',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Start managing your projects at DevBoard.</p>
    `,
  });
};

const sendTaskAssignedEmail = async ({ to, assigneeName, taskTitle, projectName }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"DevBoard" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `New task assigned: ${taskTitle}`,
    html: `
      <h2>Hi ${assigneeName},</h2>
      <p>You have been assigned a new task:</p>
      <h3>${taskTitle}</h3>
      <p>Project: <strong>${projectName}</strong></p>
      <p>Log in to DevBoard to view the details.</p>
    `,
  });
};

module.exports = { sendWelcomeEmail, sendTaskAssignedEmail };