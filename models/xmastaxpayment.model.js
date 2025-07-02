const mongoose = require('mongoose');

const xmastaxPaymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  year: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidDate: { type: Date },
  paidAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
  familyId: { type: String, required: true }
}, { timestamps: true });

// Compound index for efficient queries
xmastaxPaymentSchema.index({ memberId: 1, year: 1 }, { unique: true });
xmastaxPaymentSchema.index({ familyId: 1, year: 1 });

module.exports = mongoose.model('xmasTaxPayment', xmastaxPaymentSchema);