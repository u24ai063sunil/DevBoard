const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { uploadAvatar, uploadTaskAttachment, deleteAttachment } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.patch('/users/avatar', upload.single('avatar'), uploadAvatar);

router.post(
  '/projects/:projectId/tasks/:id/attachments',
  upload.single('file'),
  uploadTaskAttachment
);

router.delete(
  '/tasks/:id/attachments/:attachmentId',
  deleteAttachment
);

module.exports = router;