import express from 'express';
import { createOffer, getOffers, updateOffer, deleteOffer } from '../controllers/offerController.js';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

router.post('/', upload.single('bannerImage'), createOffer);
router.get('/', getOffers);
router.put('/:id', upload.single('bannerImage'), updateOffer);
router.delete('/:id', deleteOffer);

export default router;
