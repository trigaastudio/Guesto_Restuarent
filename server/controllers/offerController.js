import Offer from '../models/offerSchema.js';
import { cloudinary } from '../config/cloudinaryConfig.js';
import { emitOfferUpdate } from '../socket.js';

export const createOffer = async (req, res) => {
  try {
    const offerData = { ...req.body };
    
    
    delete offerData.cloudinaryPublicId;
    delete offerData.bannerImage;
    
    
    if (typeof offerData.specificDays === 'string') offerData.specificDays = JSON.parse(offerData.specificDays);
    if (typeof offerData.applicableItems === 'string') offerData.applicableItems = JSON.parse(offerData.applicableItems);
    if (typeof offerData.applicableCategories === 'string') offerData.applicableCategories = JSON.parse(offerData.applicableCategories);
    
    if (req.file) {
      offerData.bannerImage = req.file.path;
      offerData.cloudinaryPublicId = req.file.filename;
    }
    const offer = await Offer.create(offerData);
    emitOfferUpdate();
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOffers = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let filter = {};
    if (activeOnly === 'true') {
      filter.isActive = true;
    }
    const offers = await Offer.find(filter)
      .sort({ priority: -1 })
      .populate('applicableItems.menuItem')
      .populate('applicableCategories');
    
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const offerData = { ...req.body };

    
    delete offerData.cloudinaryPublicId;
    delete offerData.bannerImage;

    
    if (typeof offerData.specificDays === 'string') offerData.specificDays = JSON.parse(offerData.specificDays);
    if (typeof offerData.applicableItems === 'string') offerData.applicableItems = JSON.parse(offerData.applicableItems);
    if (typeof offerData.applicableCategories === 'string') offerData.applicableCategories = JSON.parse(offerData.applicableCategories);

    if (req.file) {
      
      const oldOffer = await Offer.findById(req.params.id);
      if (oldOffer?.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(oldOffer.cloudinaryPublicId);
      }
      offerData.bannerImage = req.file.path;
      offerData.cloudinaryPublicId = req.file.filename;
    }

    const offer = await Offer.findByIdAndUpdate(req.params.id, offerData, { returnDocument: 'after' });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    emitOfferUpdate();
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    
    if (offer.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(offer.cloudinaryPublicId);
    }

    await Offer.findByIdAndDelete(req.params.id);
    emitOfferUpdate();
    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
