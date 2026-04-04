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
const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`
  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"DevBoard" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your DevBoard password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4f46e5; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">DevBoard</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">
            You requested to reset your password.
            Click the button below — this link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetUrl}"
            style="display: inline-block; background: #4f46e5; color: white;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;
            font-weight: bold; margin-top: 16px;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            If you didn't request this, ignore this email. Your password won't change.
          </p>
        </div>
      </div>
    `,
  })
}
const sendVerificationEmail = async ({ to, name, verifyToken }) => {
  const verifyUrl = `http://localhost:5000/api/auth/verify-email?token=${verifyToken}`
  const transporter = createTransporter()

  await transporter.sendMail({
    from: `"DevBoard" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Verify your DevBoard email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4f46e5; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">DevBoard</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Hi ${name}, verify your email</h2>
          <p style="color: #475569; line-height: 1.6;">
            Thanks for signing up! Click the button below to verify your email address.
            This link expires in <strong>24 hours</strong>.
          </p>
          <a href="${verifyUrl}"
            style="display: inline-block; background: #4f46e5; color: white;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;
            font-weight: bold; margin-top: 16px;">
            Verify Email
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            If you didn't create this account, ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendTaskAssignedEmail,
  sendPasswordResetEmail,
}