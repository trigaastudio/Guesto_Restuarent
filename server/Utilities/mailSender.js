import { Resend } from 'resend';

const mailSender = async (email, title, body, attachments = []) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Check if RESEND_API_KEY is available
    if (!process.env.RESEND_API_KEY) {
      console.warn("WARNING: RESEND_API_KEY is missing. Emails will not be sent.");
      return { id: 'mock-id', warning: 'No API Key' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GuestO Restaurant <onboarding@resend.dev>',
      to: email,
      subject: title,
      html: body
    });

    if (error) {
      console.error("Resend Error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.log("Error in mailSender: ", error.message);
    throw error;
  }
};

export default mailSender;
