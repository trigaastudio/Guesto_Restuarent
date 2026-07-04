import Settings from '../models/settingsSchema.js';
import { emitSettingsUpdate } from '../socket.js';
import { logAdminAction } from '../services/auditService.js';

import jwt from 'jsonwebtoken';

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Check authentication
    let userRole = 'public';
    let token = null;
    
    if (req.cookies?.admin_token) token = req.cookies.admin_token;
    else if (req.cookies?.staff_token) token = req.cookies.staff_token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userRole = decoded.role || 'staff'; 
      } catch (err) {
        // Token invalid, remain public
      }
    }
    
    const isStaff = ['admin', 'staff', 'manager'].includes(userRole);
    
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
          logo: settings.restaurantDetails?.logo,
          contact: settings.restaurantDetails?.contact,
          address: settings.restaurantDetails?.address
        },
        businessHours: settings.businessHours,
        operationalSettings: {
          isOnlineOrderingEnabled: settings.operationalSettings?.isOnlineOrderingEnabled,
          isDineInEnabled: settings.operationalSettings?.isDineInEnabled,
          maintenanceMode: settings.operationalSettings?.maintenanceMode
        },
        deliverySettings: {
          deliveryFee: settings.deliverySettings?.deliveryFee,
          platformFee: settings.deliverySettings?.platformFee,
          minOrderValue: settings.deliverySettings?.minOrderValue
        },
        taxSettings: {
          taxPercentage: settings.taxSettings?.taxPercentage,
          isTaxEnabled: settings.taxSettings?.isTaxEnabled
        }
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
