const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const Task = require('../models/Task');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');

// PATCH /api/users/avatar
const uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    'devboard/avatars',
    req.file.mimetype
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: result.secure_url },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    avatar: result.secure_url,
    user,
  });
});

// POST /api/projects/:projectId/tasks/:id/attachments
const uploadTaskAttachment = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    'devboard/attachments',
    req.file.mimetype
  );

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        attachments: {
          filename: req.file.originalname,
          url: result.secure_url,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!task) return next(new AppError('Task not found', 404));

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    attachment: {
      filename: req.file.originalname,
      url: result.secure_url,
    },
  });
});

// DELETE /api/tasks/:id/attachments/:attachmentId
const deleteAttachment = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found', 404));

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) return next(new AppError('Attachment not found', 404));

  const urlParts = attachment.url.split('/');
  const publicId = urlParts
    .slice(urlParts.indexOf('upload') + 2)
    .join('/')
    .split('.')[0];

  await cloudinary.uploader.destroy(publicId);

  await Task.findByIdAndUpdate(req.params.id, {
    $pull: { attachments: { _id: req.params.attachmentId } },
  });

  res.status(200).json({ success: true, message: 'Attachment deleted' });
});

module.exports = { uploadAvatar, uploadTaskAttachment, deleteAttachment };