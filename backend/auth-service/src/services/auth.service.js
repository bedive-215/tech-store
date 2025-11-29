import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendMail.js';
import models from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import 'dotenv/config';

class AuthService {
  constructor() {
    this.User = models.User;
  }

  async register({ email, password, full_name, date_of_birth }) {

    const existing = await this.User.findOne({ where: { email } });
    if (existing) throw new AppError('Email already registered', 400);

    const password_hash = await bcrypt.hash(password, 12);

    const user = await this.User.create({
      email,
      password_hash,
      full_name,
      date_of_birth,
      email_verified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.verification_code = otp;
    user.verification_code_expires_at = otpExpires;
    await user.save();

    sendEmail({
      to: email,
      subject: 'Verify your email - Tech store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Tech store!</h2>
          <p>Hello <strong>${full_name}</strong>,</p>
          <p>Thank you for registering. Please verify your email address using the verification code below:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
            <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${otp}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in <strong>3 minutes</strong>.</p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you did not create an account, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            This is an automated email from Tech-store system. Please do not reply to this email.
          </p>
        </div>
      `,
    }).catch(err => console.error('Failed to send verification email:', err));

    return {
      user_id: user.id,
      email: user.email,
      message: 'Registration successful. Please check your email for verification code.'
    };
  }

  async login(email, password) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.email_verified) throw new AppError('Email not verified', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const payload = { user_id: user.id, email: user.email, role: user.role, full_name: user.full_name, phone_number: user.phone_number };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'secret', process.env.ACCESS_TOKEN_EXPIRES_IN);
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret', process.env.REFRESH_TOKEN_EXPIRES_IN);
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = refreshTokenExpires;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number
      }
    };
  }

  async verifyEmail({ email, otp }) {
    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    if (!user.verification_code) {
      throw new AppError('No verification code found. Please request a new code.', 400);
    }

    // Kiểm tra OTP đã hết hạn chưa (sau 3 phút)
    if (user.verification_code_expires_at < new Date()) {
      // Xóa OTP đã hết hạn
      user.verification_code = null;
      user.verification_code_expires_at = null;
      await user.save();

      throw new AppError('Verification code has expired (3 minutes limit). Please request a new code.', 400);
    }


    if (otp !== user.verification_code) {
      throw new AppError('Invalid verification code', 400);
    }

    // Cập nhật lại sau khi đã xác thực thành công
    user.email_verified = true;
    user.verification_code = null;
    user.verification_code_expires_at = null;
    await user.save();

    return {
      message: 'Email verified successfully',
      user_id: user.id,
      email: user.email
    };
  }

  async resendVerifyCode(email) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await this.User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Kiểm tra đã verify chưa
    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    // Rate limiting: chỉ cho phép gửi lại sau 1 phút
    if (user.last_otp_sent_at) {
      const timeSinceLastOTP = Date.now() - new Date(user.last_otp_sent_at).getTime();
      const oneMinute = 60 * 1000;

      if (timeSinceLastOTP < oneMinute) {
        const waitTime = Math.ceil((oneMinute - timeSinceLastOTP) / 1000);
        throw new AppError(`Please wait ${waitTime} seconds before requesting a new code`, 429);
      }
    }

    // Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 phút

    // Cập nhật database
    user.verification_token_hash = otpHash;
    user.verification_token_expires = otpExpires;
    user.last_otp_sent_at = new Date();
    user.otp_resend_count = (user.otp_resend_count || 0) + 1;
    await user.save();

    // Gửi email - SỬ DỤNG user.full_name
    sendEmail({
      to: email,
      subject: 'Verify your email - Tech store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Tech store!</h2>
          <p>Hello <strong>${user.full_name}</strong>,</p>
          <p>Thank you for registering. Please verify your email address using the verification code below:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
            <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${otp}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in <strong>3 minutes</strong>.</p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            If you did not create an account, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            This is an automated email from Tech-store system. Please do not reply to this email.
          </p>
        </div>
      `,
    }).catch(err => console.error('Failed to send verification email:', err));

    return {
      message: 'Verification code was resent!',
      email: user.email
    };
  }

  async clearRefreshToken(id) {
    const user = await this.User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.refresh_token = null;
    user.refresh_token_expires_at = null;
    await user.save();

    console.log(`User ${user.email} logged out successfully`);

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
}

export default new AuthService();