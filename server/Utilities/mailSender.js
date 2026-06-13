import nodemailer from 'nodemailer';

const mailSender = async (email, title, body, attachments = []) => {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    let info = await transporter.sendMail({
      from: `"GuestO Restaurant" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: title,
      html: body,
      attachments: attachments
    });

    return info;
  } catch (error) {
    console.log("Error in mailSender: ", error.message);
    throw error;
  }
};

export default mailSender;
