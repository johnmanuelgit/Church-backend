const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // You'll need to install this: npm install nodemailer

// Configure email transporter (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your email password or app password
  }
});

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    const admin = await Admin.findOne({ username });
    console.log('Admin found:', admin);

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ status: 'error', message: 'Account is inactive' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        role: admin.role 
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '24h' }
    );

    req.session.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      moduleAccess: admin.moduleAccess
    };

    return res.json({ 
      status: 'success', 
      message: 'Login successful', 
      token: token,
      user: req.session.admin 
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logout successful' });
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email is required' 
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'No account found with this email address' 
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    admin.resetToken = token;
    admin.resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    await admin.save();

    // Create reset URL (adjust this to match your frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/admin/reset-password?token=${token}`;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Admin Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for the Admin Portal. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© 2025 Admin Portal. All rights reserved.</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.json({ 
      status: 'success',
      message: 'Password reset instructions have been sent to your email address' 
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to send reset email. Please try again later.' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const admin = await Admin.findOne({ 
      resetToken: token, 
      resetTokenExpiry: { $gt: Date.now() } 
    });

    if (!admin) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    return res.json({ 
      status: 'success',
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Server error occurred while resetting password' 
    });
  }
};

// Middleware
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ message: 'Unauthorized' });
};

// Superadmin CRUD
exports.listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: 'admin' }).select('-password -resetToken -resetTokenExpiry');
    return res.json(admins);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, moduleAccess } = req.body;
    
    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing admin
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      moduleAccess: moduleAccess || {
        lcf: false,
        incomeExpense: false,
        members: false,
        user: false
      },
      isActive: true
    });

    await newAdmin.save();
    
    // Remove password from response
    const { password: _, ...adminResponse } = newAdmin.toObject();
    
    return res.status(201).json({ 
      message: 'Admin created successfully', 
      admin: adminResponse 
    });

  } catch (err) {
    console.error('Create admin error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { username, email, moduleAccess, isActive } = req.body;
    const updated = await Admin.findByIdAndUpdate(req.params.id, {
      username,
      email,
      moduleAccess,
      isActive
    }, { new: true }).select('-password -resetToken -resetTokenExpiry');

    if (!updated) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ message: 'Admin updated successfully', admin: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const deleted = await Admin.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// User admin login
exports.userAdminlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('User login attempt:', { email, password });

    const admin = await Admin.findOne({ email });
    console.log('Admin found:', admin);

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ status: 'error', message: 'Account is inactive' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        role: admin.role 
      }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '24h' }
    );

    req.session.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      moduleAccess: admin.moduleAccess
    };

    return res.json({ 
      status: 'success', 
      message: 'Login successful', 
      token: token,
      user: req.session.admin 
    });
  } catch (err) {
    console.error('User login error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};