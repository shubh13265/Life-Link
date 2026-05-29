import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { User } from '../models/User';
import AmbulanceDriver from '../models/AmbulanceDriver';
import PatientProfile from '../models/PatientProfile';
import HospitalAdminProfile from '../models/HospitalAdminProfile';
import Hospital from '../models/Hospital';

const router = Router();

// Store OTPs momentarily (in production, use Redis)
const otpStore: { [key: string]: { code: string; expires: number } } = {};
const otpRequestStore: {
  [key: string]: { count: number; windowStart: number; lastRequest: number };
} = {};
const otpVerifyAttemptStore: { [key: string]: number } = {};

const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const OTP_REQUEST_MAX_PER_WINDOW = 5;
const OTP_REQUEST_COOLDOWN_MS = 20 * 1000;
const OTP_VERIFY_MAX_ATTEMPTS = 5;

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();
const getOtpRequestKey = (phone: string, ip: string): string => `${phone}_${ip}`;

const checkOtpRequestLimit = (phone: string, ip: string): { allowed: boolean; message?: string } => {
  const now = Date.now();
  const key = getOtpRequestKey(phone, ip);
  const entry = otpRequestStore[key];
  if (!entry) { otpRequestStore[key] = { count: 1, windowStart: now, lastRequest: now }; return { allowed: true }; }
  if (now - entry.lastRequest < OTP_REQUEST_COOLDOWN_MS) return { allowed: false, message: 'Please wait 20 seconds before requesting OTP again' };
  if (now - entry.windowStart > OTP_REQUEST_WINDOW_MS) { otpRequestStore[key] = { count: 1, windowStart: now, lastRequest: now }; return { allowed: true }; }
  if (entry.count >= OTP_REQUEST_MAX_PER_WINDOW) return { allowed: false, message: 'Too many OTP requests. Try again after 15 minutes' };
  entry.count += 1;
  entry.lastRequest = now;
  return { allowed: true };
};

const clearOtpSecurityState = (phone: string): void => { delete otpVerifyAttemptStore[phone]; };
const incrementOtpVerifyAttempts = (phone: string): number => {
  otpVerifyAttemptStore[phone] = (otpVerifyAttemptStore[phone] || 0) + 1;
  return otpVerifyAttemptStore[phone];
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter valid 10-digit phone number' });
    }
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimit = checkOtpRequestLimit(phone, clientIp);
    if (!rateLimit.allowed) return res.status(429).json({ success: false, message: rateLimit.message });

    const otp = generateOTP();
    otpStore[phone] = { code: otp, expires: Date.now() + 5 * 60 * 1000 };
    clearOtpSecurityState(phone);
    console.log(`📱 OTP for ${phone}: ${otp} (Valid for 5 min)`);

    // Always return OTP in response (no SMS provider configured — dev/demo mode)
    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone,
      otp,
      devMessage: '⚠️ No SMS provider — use this OTP to verify',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending OTP', error });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      phone, otp, name, email,
      userType = 'patient',
      agencyName, vehicleNumber, licenseNumber,
      hospitalName,
    } = req.body;

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter valid 10-digit phone number' });
    }
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!['patient', 'ambulance_driver', 'hospital_admin'].includes(userType)) {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }

    // Verify OTP
    const storedOtp = otpStore[phone];
    if (otpVerifyAttemptStore[phone] && otpVerifyAttemptStore[phone] >= OTP_VERIFY_MAX_ATTEMPTS) {
      delete otpStore[phone]; clearOtpSecurityState(phone);
      return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
    }
    if (!storedOtp || storedOtp.code !== otp || storedOtp.expires < Date.now()) {
      const attemptCount = incrementOtpVerifyAttempts(phone);
      if (attemptCount >= OTP_VERIFY_MAX_ATTEMPTS) {
        delete otpStore[phone]; clearOtpSecurityState(phone);
        return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Phone number already registered. Please sign in instead.' });
    }

    // Create user
    const userId = crypto.randomUUID();
    const user = await User.create({
      id: userId, phone, name,
      email: email || null,
      type: userType,
      password_hash: bcryptjs.hashSync('otp_' + otp, 10),
    });

    // Create role profile — in a try/catch so we can rollback user on failure
    try {
      if (userType === 'patient') {
        await PatientProfile.create({ userId });

      } else if (userType === 'ambulance_driver') {
        // Use provided vehicleNumber or generate a guaranteed-unique one
        const safeVehicle = (vehicleNumber || '').trim() ||
          `AMB-${phone}-${Date.now().toString().slice(-4)}`;
        await AmbulanceDriver.create({
          userId,
          agencyName: agencyName || null,
          vehicleNumber: safeVehicle,
          licenseNumber: (licenseNumber || '').trim() || null,
          latitude: null,
          longitude: null,
          isActive: true,
        } as any);

      } else if (userType === 'hospital_admin') {
        // Always create a brand-new hospital for each new admin registration
        const newHospital = await Hospital.create({
          id: crypto.randomUUID(),
          name: String(hospitalName || `${name}'s Hospital`).trim(),
          email: email || `hospital-${Date.now()}@health.local`,
          phone,
          address: '',
          city: '',
          state: '',
          zipCode: '',
          latitude: 0,
          longitude: 0,
          totalBeds: 0,
          icuBeds: 0,
          icu_beds_available: 0,
          icu_beds_total: 0,
          oxygen_cylinders_available: 0,
          oxygen_cylinders_total: 0,
          ambulances_available: 0,
          ventilators: 0,
          ambulances: 0,
          doctors: 0,
          specializations: [],
          contactPerson: name,
          contactPhone: phone,
          isVerified: false,
        } as any);
        await HospitalAdminProfile.create({ userId, hospitalId: newHospital.id });
      }
    } catch (profileErr: any) {
      // Rollback: delete the user so they can try again with a fresh state
      await user.destroy().catch(() => {});
      console.error('❌ Profile creation failed, user rolled back:', profileErr?.message);
      return res.status(500).json({
        success: false,
        message: 'Account setup failed. Please try registering again.',
      });
    }

    // Issue JWT
    const token = jwt.sign(
      { userId, phone, userType },
      process.env.JWT_SECRET || 'LifeLink_super_secret_jwt_key_2026',
      { expiresIn: '30d' }
    );
    delete otpStore[phone];
    clearOtpSecurityState(phone);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { userId, userName: name, userEmail: email, userType, token },
    });
  } catch (error: any) {
    console.error('❌ Registration Error:', error?.message);
    if (error instanceof UniqueConstraintError) {
      const field = error.errors?.[0]?.path || '';
      if (field === 'phone') {
        return res.status(400).json({ success: false, message: 'Phone number already registered. Please sign in instead.' });
      }
      return res.status(400).json({ success: false, message: 'A registration conflict occurred. Please try again.' });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || 'Validation error' });
    }
    res.status(500).json({ success: false, message: 'Registration error: ' + error?.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || phone.length !== 10) return res.status(400).json({ success: false, message: 'Invalid phone number' });
    const storedOtp = otpStore[phone];
    if (otpVerifyAttemptStore[phone] && otpVerifyAttemptStore[phone] >= OTP_VERIFY_MAX_ATTEMPTS) {
      delete otpStore[phone]; clearOtpSecurityState(phone);
      return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
    }
    if (!storedOtp || storedOtp.code !== otp || storedOtp.expires < Date.now()) {
      const attemptCount = incrementOtpVerifyAttempts(phone);
      if (attemptCount >= OTP_VERIFY_MAX_ATTEMPTS) {
        delete otpStore[phone]; clearOtpSecurityState(phone);
        return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP verification error', error });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter valid 10-digit phone number' });
    }
    const storedOtp = otpStore[phone];
    if (otpVerifyAttemptStore[phone] && otpVerifyAttemptStore[phone] >= OTP_VERIFY_MAX_ATTEMPTS) {
      delete otpStore[phone]; clearOtpSecurityState(phone);
      return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
    }
    if (!storedOtp || storedOtp.code !== otp || storedOtp.expires < Date.now()) {
      const attemptCount = incrementOtpVerifyAttempts(phone);
      if (attemptCount >= OTP_VERIFY_MAX_ATTEMPTS) {
        delete otpStore[phone]; clearOtpSecurityState(phone);
        return res.status(429).json({ success: false, message: 'Too many invalid attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found. Please register first.' });
    }
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, userType: user.type },
      process.env.JWT_SECRET || 'LifeLink_super_secret_jwt_key_2026',
      { expiresIn: '30d' }
    );
    delete otpStore[phone];
    clearOtpSecurityState(phone);
    res.json({
      success: true,
      message: 'Login successful',
      data: { userId: user.id, userName: user.name, userEmail: user.email, userType: user.type, phone: user.phone, token },
    });
  } catch (error: any) {
    console.error('❌ Login Error:', error?.message);
    res.status(500).json({ success: false, message: 'Login error: ' + error?.message });
  }
});

// POST /api/auth/verify-token
router.post('/verify-token', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(400).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'LifeLink_super_secret_jwt_key_2026');
    res.json({ success: true, data: decoded });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// GET /api/auth/me - Returns current user + linked hospital for hospital_admin
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'LifeLink_super_secret_jwt_key_2026');
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let hospital = null;
    if (user.type === 'hospital_admin') {
      const profile = await HospitalAdminProfile.findOne({ where: { userId: user.id } });
      if (profile) hospital = await Hospital.findByPk(profile.hospitalId);
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userType: user.type,
        phone: user.phone,
        hospital,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

export default router;
