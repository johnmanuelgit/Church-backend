const mongoose = require('mongoose');

const xmastaxRateSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  adultTax: { type: Number, required: true, default: 1000 },
  childTax: { type: Number, required: true, default: 500 },
  adultAgeThreshold: { type: Number, required: true, default: 18 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('xmasTaxRate', xmastaxRateSchema);
