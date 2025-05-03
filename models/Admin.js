const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  resetToken: String,
  resetTokenExpiry: Date,
});

module.exports = mongoose.model('Admin', AdminSchema);
