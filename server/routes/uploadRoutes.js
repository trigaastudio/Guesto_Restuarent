import express from 'express';
import { upload } from '../config/cloudinaryConfig.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/image', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Upload failed'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    res.status(200).json({ 
      url: req.file.path,
      public_id: req.file.filename 
    });
  });
});

export default router;
