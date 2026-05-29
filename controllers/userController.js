const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const UserMongo = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const validators = require('../utils/validators');


const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};


const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate input format
    if (!validators.validateName(name)) {
      return res.status(400).json({ message: 'Invalid name format (2-100 characters, letters only)' });
    }

    if (!validators.validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validators.validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)' 
      });
    }

    let userExists;
    try {
      userExists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    } catch (err) {
      userExists = await UserMongo.findOne({ email: email.toLowerCase() });
    }

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: { 
          name: name.trim(), 
          email: email.toLowerCase(), 
          password: hashedPassword 
        },
      });
    } catch (prismaError) {
      console.warn('Prisma registration failed, using MongoDB...', prismaError.message);
      user = await UserMongo.create({
        name: name.trim(), 
        email: email.toLowerCase(), 
        password: hashedPassword
      });
      user.id = user._id.toString();
    }

    if (user) {
      // Send Welcome Email (non-blocking)
      sendEmail(user.email, 'welcomeEmail', { name: user.name }).catch(err => console.error('Email failed:', err));

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};


const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('DEBUG authUser req.headers:', req.headers);
    try { console.log('DEBUG authUser req.body (raw):', JSON.stringify(req.body)); } catch (e) { console.log('DEBUG authUser req.body (inspect):', req.body); }
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (prismaError) {
      console.warn('Prisma login failed, falling back to MongoDB...', prismaError.message);
      user = await UserMongo.findOne({ email });
      if (user) user.id = user._id.toString(); // Normalize ID
    }

    if (!user && !res.headersSent) {
      // If prisma didn't throw but user wasn't found, check Mongo anyway
      user = await UserMongo.findOne({ email });
      if (user) user.id = user._id.toString();
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please sign up first.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user._id },
      data: {
        name: req.body.name || undefined,
        email: req.body.email || undefined,
      }
    });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(404).json({ message: 'User not found or update failed' });
  }
};

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user._id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password' });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOTP: otp,
        resetPasswordExpires: otpExpires
      }
    });

    await sendEmail(email, 'passwordResetOTP', { name: user.name, otp });

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordOTP: otp,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

// @desc    Reset Password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetPasswordOTP: otp,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOTP: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed' });
  }
};

// @desc    Request OTP for login (Email or Phone)
// @route   POST /api/users/login-request-otp
// @access  Public
const requestOTP = async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (phoneNumber) {
      user = await prisma.user.findFirst({ where: { phoneNumber } });
    } else {
      return res.status(400).json({ message: 'Please provide email or phone' });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: '',
          email: email || `user_${Date.now()}@temp.com`,
          phoneNumber: phoneNumber || null,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isAdmin: false
        }
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOTP: otp,
        resetPasswordExpires: otpExpires
      }
    });

    if (email) {
      await sendEmail(email, 'passwordResetOTP', { name: user.name, otp });
      res.json({ message: 'OTP sent to your email' });
    } else {
      await sendSMS(phoneNumber, otp);
      res.json({ message: 'OTP sent to your phone number' });
    }
  } catch (error) {
    console.error('OTP Request Error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// @desc    Verify OTP and Login
// @route   POST /api/users/login-verify-otp
// @access  Public
const verifyOTPLogin = async (req, res) => {
  const { email, phoneNumber, otp } = req.body;

  try {
    let user;
    if (email) {
      user = await prisma.user.findFirst({
        where: { email, resetPasswordOTP: otp, resetPasswordExpires: { gt: new Date() } }
      });
    } else if (phoneNumber) {
      user = await prisma.user.findFirst({
        where: { phoneNumber, resetPasswordOTP: otp, resetPasswordExpires: { gt: new Date() } }
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOTP: null,
        resetPasswordExpires: null
      }
    });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
};

// @desc    Google Auth Login/Signup
// @route   POST /api/users/google-auth
// @access  Public
const googleAuth = async (req, res) => {
  const { name, email, googleId } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          isAdmin: false
        }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  updateUserProfile,
  updateUserPassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  googleAuth,
  requestOTP,
  verifyOTPLogin
};
