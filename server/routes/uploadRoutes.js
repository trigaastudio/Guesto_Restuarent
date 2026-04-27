import express from 'express';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.post('/image', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(400).json({ 
        message: 'Cloudinary Upload Error', 
        error: err.message 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.status(200).json({ 
      url: req.file.path,
      public_id: req.file.filename 
    });
  });
});

export default router;
