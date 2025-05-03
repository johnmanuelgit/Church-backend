const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  const admin = await Admin.findOne({ username: 'admin' });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await new Admin({ username: 'admin', email: 'sjohnmanuelpc@gmail.com', password: hashed }).save();
    console.log('Default admin created');
  }
};

module.exports = initAdmin;
