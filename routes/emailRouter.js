const express = require('express');
const multer = require('multer');
const { emailController } = require('../controller');
const router = express.Router();


// Configure Multer for file upload
const upload = multer({
    dest: 'uploads/', // Directory where uploaded files will be stored
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
      // Accept Excel files only
      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
      } else {
        cb(new Error('Only Excel files are allowed'), false);
      }
    }
  });
router.post('/', upload.single('file'),emailController.sendEmail);

module.exports = router;