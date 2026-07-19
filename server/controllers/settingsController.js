import Settings from '../models/settingsSchema.js';
import { emitSettingsUpdate } from '../socket.js';
import NodeCache from 'node-cache';
import jwt from 'jsonwebtoken';

const settingsCache = new NodeCache({ stdTTL: 60, useClones: false });

export const getSettings = async (req, res) => {
  try {
    let settings = settingsCache.get('settings');
    if (!settings) {
      settings = await Settings.getSettings();
      settingsCache.set('settings', settings);
    }
    
    // Check authentication
    let userRole = 'public';
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.admin_token) {
      token = req.cookies.admin_token;
    } else if (req.cookies?.staff_token) {
      token = req.cookies.staff_token;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userRole = decoded.role || 'staff'; 
      } catch (err) {
        // Token invalid, remain public
      }
    }
    
    const isStaff = ['admin', 'staff', 'manager', 'kitchen', 'waiter', 'cashier'].includes(userRole);
    
    if (isStaff) {
      res.status(200).json({
        success: true,
        data: settings
      });
    } else {
      // Public projection
      const publicSettings = {
        _id: settings._id,
        restaurantDetails: {
          name: settings.restaurantDetails?.name,
          tagline: settings.restaurantDetails?.tagline,
          contactNumber: settings.restaurantDetails?.contactNumber,
          email: settings.restaurantDetails?.email,
          address: settings.restaurantDetails?.address,
          location: settings.restaurantDetails?.location
        },
        branding: settings.branding,
        operationalSettings: settings.operationalSettings,
        deliverySettings: settings.deliverySettings,
        paymentSettings: settings.paymentSettings
      };
      
      res.status(200).json({
        success: true,
        data: publicSettings
      });
    }
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
    settingsCache.set('settings', settings);
    emitSettingsUpdate(settings);
    

    
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
