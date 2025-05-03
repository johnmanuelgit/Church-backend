const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.status(200).json({ message: 'Login successful' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const token = crypto.randomBytes(32).toString('hex');
  admin.resetToken = token;
  admin.resetTokenExpiry = Date.now() + 3600000;
  await admin.save();

  res.json({ message: 'Reset token generated', token });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const admin = await Admin.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  if (!admin) return res.status(400).json({ message: 'Invalid or expired token' });

  admin.password = await bcrypt.hash(newPassword, 10);
  admin.resetToken = undefined;
  admin.resetTokenExpiry = undefined;
  await admin.save();

  res.json({ message: 'Password reset successful' });
};
