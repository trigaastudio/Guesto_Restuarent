import express from 'express';
import { createOffer, getOffers, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { upload } from '../config/cloudinaryConfig.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, upload.single('bannerImage'), createOffer);
router.get('/', getOffers);
router.put('/:id', protect, admin, upload.single('bannerImage'), updateOffer);
router.delete('/:id', protect, admin, deleteOffer);

export default router;
