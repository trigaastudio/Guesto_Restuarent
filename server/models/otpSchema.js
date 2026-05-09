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
    expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation
  },
});

// Define a function to send emails
async function sendVerificationEmail(email, otp, logoUrl) {
  try {
    const attachments = [];
    let logoCid = null;

    // If logoUrl is a local path (from public folder), try to embed it as CID
    // We'll look for logo-golden.png or logo-dark.png as defaults if logoUrl is localhost
    if (logoUrl && (logoUrl.includes('localhost') || logoUrl.includes('127.0.0.1'))) {
      const publicPath = path.join(__dirname, '..', '..', 'client', 'public');
      const logoFileName = logoUrl.split('/').pop();
      const logoFilePath = path.join(publicPath, logoFileName);

      if (fs.existsSync(logoFilePath)) {
        logoCid = 'logo';
        attachments.push({
          filename: logoFileName,
          path: logoFilePath,
          cid: logoCid
        });
      }
    }

    const mailResponse = await mailSender(
      email,
      "Verification Code - GuestO Admin",
      `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 40px auto; background-color: #ffffff; color: #1e293b; border-radius: 32px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #0f172a; padding: 50px 20px; text-align: center;">
          ${logoCid ? `
            <img src="cid:${logoCid}" alt="GuestO Logo" style="height: 60px; width: auto; margin-bottom: 10px;">
          ` : (logoUrl && !logoUrl.includes('localhost') ? `
            <img src="${logoUrl}" alt="GuestO Logo" style="height: 60px; width: auto; margin-bottom: 10px;">
          ` : `
            <div style="margin-bottom: 10px;">
              <span style="font-size: 32px; font-weight: 900; color: #D97706; letter-spacing: 4px; text-transform: uppercase; border-bottom: 4px solid #D97706; padding-bottom: 4px;">GuestO</span>
            </div>
          `)}
          <p style="margin: 15px 0 0 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 3px;">Advanced Restaurant Systems</p>
        </div>
        
        <div style="padding: 50px 40px; text-align: center;">
          <h2 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Verification Code</h2>
          <p style="margin: 0 0 40px 0; font-size: 14px; color: #64748b; line-height: 1.6;">Use the code below to complete your credential update. This code will expire in 5 minutes.</p>
          
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 24px; border: 2px dashed #e2e8f0; display: inline-block; min-width: 200px;">
            <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #D97706; font-family: 'Courier New', Courier, monospace; margin-left: 12px;">${otp}</span>
          </div>
          
          <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.</p>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 25px; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 GuestO Restaurant Systems</p>
        </div>
      </div>
      `,
      attachments
    );
    // Email sent successfully
  } catch (error) {
    // Error occurred while sending email
    throw error;
  }
}

// Define a post-save hook to send email after the document has been saved
otpSchema.pre("save", async function () {
  // Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp, this.logoUrl);
  }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
