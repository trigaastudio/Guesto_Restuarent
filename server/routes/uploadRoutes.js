import express from 'express';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.post('/image', (req, res, next) => {
  console.log('Incoming upload request...');
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary Error:', err);
      return res.status(400).json({ 
        success: false,
        message: err.message || 'Upload failed',
        details: err
      });
    }
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log('✅ File uploaded successfully:', req.file.path);
    
    res.status(200).json({ 
      url: req.file.path,
      public_id: req.file.filename 
    });
  });
});

export default router;
