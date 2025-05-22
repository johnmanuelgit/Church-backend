const mongoose = require('mongoose');

const taxRecordSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
  },
  taxPaid: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add compound index for memberId and year
taxRecordSchema.index({ memberId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('TaxRecord', taxRecordSchema);