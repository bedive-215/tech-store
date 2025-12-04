// utils/sendEmail.js
import nodemailer from 'nodemailer';
import 'dotenv/config';

// Tạo transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // false vì port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // App Password Gmail
  },
});

// Gửi email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}: ${info.messageId}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export default sendEmail;