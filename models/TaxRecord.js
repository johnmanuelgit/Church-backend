const mongoose = require('mongoose');

const taxRecordSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  year: { type: Number, required: true },
  taxPaid: { type: Boolean, default: false },
  amount: { type: Number } // <-- ✅ Add this line
});


module.exports = mongoose.model('TaxRecord', taxRecordSchema);
