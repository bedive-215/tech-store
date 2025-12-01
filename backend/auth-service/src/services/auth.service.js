import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendMail.js';
import models from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import 'dotenv/config';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import axios from 'axios';

class AuthService {
  constructor() {
    this.User = models.User;
    this.UserOAuth = models.UserOauth;
  }

  makeCode() {
    const code = crypto.randomInt(100000, 999999);
    return code;
  }

  async register({ email, password, full_name, date_of_birth, phone_number }) {

    const existing = await this.User.findOne({ where: { email } });
    if (existing) throw new AppError('Email already registered', 400);

    const password_hash = await bcrypt.hash(password, 12);

    const user = await this.User.create({
      email,
      password_hash,
      full_name,
      date_of_birth,
      phone_number,
      email_verified: false,
    });

    const otp = this.makeCode();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.verification_code = otp;
    user.verification_code_expires_at = otpExpires;
    user.last_verification_code_sent_at = new Date();
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
          
          <p style="color: #666;">This code will expire in <strong>${otpExpires} minutes</strong>.</p>
          
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
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = refreshTokenExpires;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user
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
      user.last_verification_code_sent_at = null;
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

    // Rate limit: 1 phút
    if (user.last_verification_code_sent_at) {
      const diffMs =
        Date.now() - new Date(user.last_verification_code_sent_at).getTime();

      if (diffMs < 60000) {
        const waitSec = Math.ceil((60000 - diffMs) / 1000);
        throw new AppError(`Please wait ${waitSec}s before resending code`, 429);
      }
    }

    // Tạo OTP mới
    const otp = this.makeCode();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.verification_code = otp;
    user.verification_code_expires_at = otpExpires;
    user.last_verification_code_sent_at = new Date();
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
          
          <p style="color: #666;">This code will expire in <strong>${otpExpires} minutes</strong>.</p>
          
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

  async verifyGoogleToken(token) {
    if (!token) throw new AppError('Google token is required', 400);

    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
      );

      const data = response.data;
      if (!data.email) throw new AppError('Invalid Google token', 401);

      return {
        email: data.email,
        provider_uid: data.sub,
        name: data.name || data.email.split('@')[0],
      };
    } catch (err) {
      console.error('Google token verification failed:', err.response?.data || err.message);
      throw new AppError('Invalid Google token', 401);
    }
  }

  async oauthLogin({ token, phone_number, date_of_birth }) {
    if (!token) throw new AppError('Token is required', 400);

    const googleData = await this.verifyGoogleToken(token);
    const { email, provider_uid, name } = googleData;

    // 1. Tìm user theo email
    let user = await this.User.findOne({ where: { email } });

    if (!user) {
      user = await this.User.create({
        email,
        full_name: name,
        email_verified: true,
        password_hash: null,
        phone_number: phone_number || null,
        date_of_birth: date_of_birth || null,
      });
    }

    // 2. Tìm info OAuth
    let oauth = await this.UserOAuth.findOne({
      where: { provider_uid }
    });

    if (!oauth) {
      await this.UserOAuth.create({
        user_id: user.id,
        provider_uid,
      });
    }

    let updated = false;

    if (!user.phone_number && phone_number) {
      user.phone_number = phone_number;
      updated = true;
    }

    if (!user.date_of_birth && date_of_birth) {
      user.date_of_birth = date_of_birth;
      updated = true;
    }

    if (updated) await user.save();

    // 4. Tạo JWT
    const payload = {
      user_id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    return {
      message: "OAuth login successful",
      accessToken,
      refreshToken,
      user,
    };
  }

  async sendResetPasswordCode(email) {
    if (!email) throw new AppError('Email is required', 400);
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    const code = this.makeCode();
    const expires = new Date(Date.now() + 1 * 60 * 1000);

    user.password_reset_code = code;
    user.password_reset_code_expires_at = expires;
    await user.save();

    // Gửi email
    await sendEmail({
      to: email,
      subject: "Reset Your Password - Tech Store",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Welcome to Tech store!</h2>
          <p>Hello <strong>${user.full_name}</strong>,</p>
          <p>Your reset password code below:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
            <h1 style="color: black; font-size: 42px; letter-spacing: 10px; margin: 10px 0;">${code}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in <strong>${expires}} minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            This is an automated email from Tech-store system. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    return { message: "Reset password code sent to email" };
  }

  async verifyResetPasswordCode(email, code) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    if (!user.password_reset_code)
      throw new AppError("No reset code. Please request again.", 400);

    if (user.password_reset_code_expires_at < new Date()) {
      user.password_reset_code = null;
      user.password_reset_code_expires_at = null;
      await user.save();
      throw new AppError("Reset code expired. Please request again.", 400);
    }

    if (code !== user.password_reset_code)
      throw new AppError("Invalid reset code", 400);

    return { message: "Reset code verified" };
  }

  async resetPassword(email, newPassword) {
    const user = await this.User.findOne({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    if (!user.password_reset_code)
      throw new AppError("Reset code not verified", 400);

    const hash = await bcrypt.hash(newPassword, 12);
    user.password_hash = hash;

    user.password_reset_code = null;
    user.password_reset_code_expires_at = null;
    user.refresh_token = null;
    user.refresh_token_expires_at = null;

    await user.save();

    return { message: "Password reset successfully" };
  }

}

export default new AuthService();