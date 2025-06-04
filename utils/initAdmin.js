const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: 'john' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('john01', 10);
      const defaultAdmin = new Admin({
        username: 'john',
        email: 'sjohnmanuelpc@gmail.com',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        moduleAccess: {
          lcf: true,
          incomeExpense: true,
          members: true,
          user: true,
        },
      });

      await defaultAdmin.save();
      console.log('✅ Default superadmin created.');
    } else {
      console.log('ℹ️ Default superadmin already exists.');
    }
  } catch (err) {
    console.error('❌ Error creating default admin:', err);
  }
};

module.exports = initAdmin;
