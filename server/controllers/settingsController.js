import Settings from '../models/settingsSchema.js';

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
    
    // Update top-level fields and mark them as modified for Mongoose
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
        settings.markModified(key); // Crucial for nested objects in Mongoose
      }
    });

    await settings.save();
    
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
