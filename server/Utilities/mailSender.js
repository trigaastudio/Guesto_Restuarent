import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    let info = await transporter.sendMail({
      from: `"GuestO Restaurant" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email info: ", info);
    return info;
  } catch (error) {
    console.log("Error in mailSender: ", error.message);
    throw error;
  }
};

export default mailSender;
