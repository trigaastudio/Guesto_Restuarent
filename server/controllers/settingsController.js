import Settings from '../models/settingsSchema.js';
import { emitSettingsUpdate } from '../socket.js';
import { logAdminAction } from '../services/auditService.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
        settings.markModified(key); 
      }
    });

    await settings.save();
    emitSettingsUpdate(settings);
    
    await logAdminAction(req, 'UPDATE_SETTINGS', 'Settings', settings._id, { updatedFields: Object.keys(req.body) });
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
