import mongoose from 'mongoose';
import mailSender from '../Utilities/mailSender.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  logoUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, 
  },
});

import Settings from './settingsSchema.js';


async function sendVerificationEmail(email, otp) {
  try {
    const settings = await Settings.getSettings();
    const restaurantName = settings.restaurantDetails.name || "GuestO";
    
    
    let primaryLogoPath = '/logo-golden.png';
    
    const attachments = [];
    let logoSrc = '';

    // Function to handle logo resolution
    const resolveLogo = (logoPathToUse, cidName) => {
      const logoFileName = 'logo-golden.png';
      const logoPath = path.join(__dirname, '..', '..', 'client', 'public', logoFileName);
        
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: logoFileName,
          path: logoPath,
          cid: cidName
        });
        return `cid:${cidName}`;
      }
      return '';
    };

    logoSrc = resolveLogo(primaryLogoPath, 'restaurantLogo');

    const body = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000000;">
          <div style="background-color: #0a0a0a; border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; border: 1px solid #1a1a1a;">
            <div style="margin-bottom: 30px;">
              ${logoSrc ? `<img src="${logoSrc}" alt="${restaurantName}" style="height: 60px; width: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">` : ''}
            </div>
            
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px;">Verification Code</h1>
            <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin-bottom: 35px;">
              You requested to update your administrative credentials. Please use the following code to verify your identity.
            </p>
            
            <div style="background-color: #B91C1C; color: #ffffff; padding: 25px; border-radius: 20px; font-size: 36px; font-weight: 900; letter-spacing: 12px; margin-bottom: 35px; box-shadow: 0 8px 20px rgba(185, 28, 28, 0.4);">
              ${otp}
            </div>
            
            <p style="color: #666666; font-size: 12px; font-weight: 600; text-transform: uppercase; tracking-wider;">
              Valid for 5 minutes only
            </p>
            
            <div style="margin-top: 40px; pt-30px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
              <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 5px;">If you didn't request this code, you can safely ignore this email.</p>
              <p style="color: #ffffff; font-size: 14px; font-weight: 800;">Team ${restaurantName} Admin</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailSender(
      email,
      "Verification Code - GuestO Admin",
      body,
      attachments
    );
  } catch (error) {
    console.error("Error in OTP sendVerificationEmail:", error);
    throw error;
  }
}


otpSchema.pre("save", async function () {
  
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
