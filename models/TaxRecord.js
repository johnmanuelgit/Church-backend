const mongoose = require('mongoose');

const taxRecordSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  year: { type: Number, required: true },
  taxPaid: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for memberId and year to ensure unique records
taxRecordSchema.index({ memberId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('TaxRecord', taxRecordSchema);