const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '1050681123836-7ngn8pohp4rjh15f60f8bj3c974eessn.apps.googleusercontent.com');

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role, user_id: id, user_role: role },
    process.env.JWT_SECRET || 'supersecretkeyforautodocapp',
    { expiresIn: '7d' }
  );
};

const formatUserResponse = (userDoc) => {
  const userObj = userDoc.toJSON ? userDoc.toJSON() : userDoc;
  return {
    _id: userObj._id || userObj.user_id,
    id: userObj._id || userObj.user_id,
    user_id: userObj._id || userObj.user_id,
    name: userObj.user_full_name || userObj.name,
    user_full_name: userObj.user_full_name || userObj.name,
    email: userObj.user_email || userObj.email,
    user_email: userObj.user_email || userObj.email,
    phone: userObj.user_phone_number || userObj.phone,
    user_phone_number: userObj.user_phone_number || userObj.phone,
    role: userObj.user_role || userObj.role,
    user_role: userObj.user_role || userObj.role,
    profilePhoto: userObj.user_profile_image_path || userObj.profilePhoto || null,
    user_profile_image_path: userObj.user_profile_image_path || userObj.profilePhoto || null,
    user_is_verified: userObj.user_is_verified || false
  };
};

/**
 * Register User
 * POST /api/users/register
 */
const register = async (req, res, next) => {
  try {
    const { name, user_full_name, email, user_email, password, user_password_hash, phone, user_phone_number, role, user_role } = req.body;

    const inputName = user_full_name || name;
    const inputEmail = (user_email || email || '').toLowerCase().trim();
    const inputPassword = user_password_hash || password;
    const inputPhone = user_phone_number || phone || 'Not provided';

    let mappedRole = user_role || role || 'owner';
    if (mappedRole === 'admin') mappedRole = 'owner';
    if (mappedRole === 'serviceCenter') mappedRole = 'service_center';
    if (mappedRole !== 'owner' && mappedRole !== 'service_center') mappedRole = 'owner';

    if (mappedRole === 'service_center') {
      const requiredFields = [
        'contactPersonName',
        'businessName',
        'businessAddress',
        'city',
        'pincode',
        'servicesOffered'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const val = req.body[field];
        if (field === 'servicesOffered') {
          return !val || (Array.isArray(val) && val.length === 0);
        }
        return !val || (typeof val === 'string' && val.trim() === '');
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Validation failed: Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }
    }

    const userExists = await User.findOne({ user_email: inputEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Unable to register with these details'
      });
    }

    let user;
    if (mappedRole === 'service_center') {
      const ServiceCenter = require('../models/ServiceCenter');
      try {
        user = await User.create({
          user_full_name: inputName,
          user_email: inputEmail,
          user_password_hash: inputPassword || undefined,
          googleId: req.body.googleId || null,
          user_phone_number: inputPhone,
          user_role: mappedRole
        });

        const serviceCenterName = req.body.service_center_name || req.body.businessName || '';
        const serviceCenterAddress = req.body.service_center_address || req.body.businessAddress || '';
        const serviceCenterPhone = req.body.service_center_phone_number || req.body.phone || inputPhone;

        await ServiceCenter.create({
          user_id: user._id,
          service_center_name: serviceCenterName.trim(),
          service_center_address: serviceCenterAddress.trim(),
          service_center_phone_number: serviceCenterPhone,
          city: req.body.city ? req.body.city.trim() : '',
          pincode: req.body.pincode ? req.body.pincode.trim() : '',
          businessRegistrationNumber: req.body.businessRegistrationNumber ? req.body.businessRegistrationNumber.trim() : '',
          contactPersonName: req.body.contactPersonName ? req.body.contactPersonName.trim() : '',
          servicesOffered: Array.isArray(req.body.servicesOffered) ? req.body.servicesOffered : [req.body.servicesOffered],
          businessDocumentUrl: (req.body.businessDocumentUrl && typeof req.body.businessDocumentUrl === 'string' && req.body.businessDocumentUrl.trim()) || '/uploads/mock_business_license.pdf',
          approvalStatus: 'pending',
          status: 'pending',
          operatingHours: req.body.operatingHours || '9:00 AM - 6:00 PM',
          shopImages: req.body.shopImages || []
        });

        return res.status(201).json({
          status: 'pending_approval',
          message: 'Your service center account is awaiting admin approval.'
        });
      } catch (err) {
        if (user && user._id) {
          await User.findByIdAndDelete(user._id);
        }
        throw err;
      }
    }

    user = await User.create({
      user_full_name: inputName,
      user_email: inputEmail,
      user_password_hash: inputPassword,
      user_phone_number: inputPhone,
      user_role: mappedRole
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.user_role),
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

/**
 * Login User
 * POST /api/users/login
 */
const login = async (req, res, next) => {
  try {
    const emailInput = req.body.user_email || req.body.email;
    const passwordInput = req.body.user_password_hash || req.body.password;
    
    if (!emailInput || !passwordInput) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const cleanEmail = emailInput.toLowerCase().trim();
    console.log(`[DEBUG LOGIN] Attempting email: "${cleanEmail}"`);

    const user = await User.findOne({ user_email: cleanEmail });
    if (!user) {
      console.log(`[DEBUG LOGIN] User not found in DB for email: "${cleanEmail}"`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    console.log(`[DEBUG LOGIN] User found: ${user.user_email}, role: ${user.user_role}`);

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account temporarily locked due to multiple failed attempts. Try again later. (${remainingMinutes} mins remaining)`
      });
    }

    const isMatch = await user.comparePassword(passwordInput);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        return res.status(403).json({
          success: false,
          message: 'Account temporarily locked due to multiple failed attempts. Try again later.'
        });
      }

      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.user_role === 'service_center') {
      const ServiceCenter = require('../models/ServiceCenter');
      const serviceCenter = await ServiceCenter.findOne({ user_id: user._id });
      
      if (!serviceCenter || (serviceCenter.approvalStatus !== 'approved' && serviceCenter.service_center_is_verified !== true)) {
        return res.status(403).json({
          success: false,
          error: 'pending_approval',
          message: 'Your service center account is awaiting admin approval.'
        });
      }
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.status(200).json({
      success: true,
      token: generateToken(user._id, user.user_role),
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * Get User Profile
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.user_id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.user_id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      profilePhoto,
      profilePhotoUrl,
      user_profile_image_path,
      address,
      city,
      pincode,
      alternateContactNumber,
      emergencyContact,
      preferredLanguage,
      notificationPreferences
    } = req.body;

    if (address !== undefined) user.address = address;

    const photoToUpdate = user_profile_image_path !== undefined ? user_profile_image_path : (profilePhoto !== undefined ? profilePhoto : profilePhotoUrl);
    if (photoToUpdate !== undefined) user.user_profile_image_path = photoToUpdate;

    if (city !== undefined) user.city = city;
    if (pincode !== undefined) user.pincode = pincode;
    if (alternateContactNumber !== undefined) user.alternateContactNumber = alternateContactNumber;

    if (emergencyContact !== undefined) {
      user.emergencyContact = {
        name: emergencyContact.name !== undefined ? emergencyContact.name : (user.emergencyContact?.name || null),
        number: emergencyContact.number !== undefined ? emergencyContact.number : (user.emergencyContact?.number || null)
      };
    }

    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;

    if (notificationPreferences !== undefined) {
      user.notificationPreferences = {
        sms: notificationPreferences.sms !== undefined ? notificationPreferences.sms : (user.notificationPreferences?.sms ?? true),
        push: notificationPreferences.push !== undefined ? notificationPreferences.push : (user.notificationPreferences?.push ?? true),
        email: notificationPreferences.email !== undefined ? notificationPreferences.email : (user.notificationPreferences?.email ?? true)
      };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password - Send OTP
 * POST /api/users/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const emailInput = req.body.user_email || req.body.email;
    if (!emailInput) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ user_email: emailInput.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[FORGOT PASSWORD] Generated OTP for ${emailInput}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'A 6-digit reset code has been sent to your email.',
      devOtp: otp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request. Please try again.'
    });
  }
};

/**
 * Reset Password with OTP
 * POST /api/users/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const emailInput = req.body.user_email || req.body.email;
    const { otp, newPassword, user_password_hash } = req.body;
    const inputPassword = user_password_hash || newPassword;

    const user = await User.findOne({ user_email: (emailInput || '').toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    if (
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== (otp || '').trim() ||
      !user.resetPasswordOtpExpire ||
      user.resetPasswordOtpExpire.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.'
      });
    }

    user.user_password_hash = inputPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpire = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
};

/**
 * Google Sign-In / Authentication
 * POST /api/users/google-login
 */
const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role = 'owner', user_role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    let payload;
    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || '1050681123836-7ngn8pohp4rjh15f60f8bj3c974eessn.apps.googleusercontent.com'
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google ID token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token: ' + err.message
      });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account must have an associated email'
      });
    }

    let user = await User.findOne({
      $or: [{ googleId }, { user_email: email.toLowerCase() }]
    });

    const targetRole = user_role || role;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.user_profile_image_path) user.user_profile_image_path = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        user_full_name: name || 'Google User',
        user_email: email.toLowerCase(),
        googleId,
        user_role: ['owner', 'service_center'].includes(targetRole) ? targetRole : 'owner',
        user_phone_number: 'Not provided',
        user_profile_image_path: picture || null
      });
    }

    const token = generateToken(user._id, user.user_role);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Google Sign-In Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during Google authentication'
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword
};
