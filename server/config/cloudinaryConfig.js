import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary Error: Missing credentials in .env file');
} else {
  console.log('☁️ Cloudinary configured for:', process.env.CLOUDINARY_CLOUD_NAME);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'guesto',
    format: 'png',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `img_${uniqueSuffix}`;
    },
    transformation: [
      { quality: 'auto' }
    ],
  },
});


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

export { cloudinary, upload };
