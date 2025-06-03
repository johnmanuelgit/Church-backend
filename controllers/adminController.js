const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

    req.session.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      moduleAccess: admin.moduleAccess
    };

    return res.json({ status: 'success', message: 'Login successful', user: req.session.admin });
  } catch (err) {
    console.error('Login error:', err); // <- This should print the exact error
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
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const token = crypto.randomBytes(32).toString('hex');
    admin.resetToken = token;
    admin.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await admin.save();

    return res.json({ message: 'Reset token generated', token });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const admin = await Admin.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!admin) return res.status(400).json({ message: 'Invalid or expired token' });

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error' });
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
    const admins = await Admin.find({ role: 'admin' });
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
    return res.status(201).json({ message: 'Admin created successfully', admin: newAdmin });

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
    }, { new: true });

    if (!updated) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ message: 'Admin updated successfully' });
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

  exports.userAdminlogin = async (req, res) => {
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

    req.session.admin = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      moduleAccess: admin.moduleAccess
    };

    return res.json({ status: 'success', message: 'Login successful', user: req.session.admin });
  } catch (err) {
    console.error('Login error:', err); // <- This should print the exact error
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

};
