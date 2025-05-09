const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const memberSchema = new mongoose.Schema({
  id: { type: Number },
  memberNumber: { type: Number },
  parentId: { type: String, default: null, index: true }, // Now a string
  name: { type: String, required: true },
  dateOfBirth: { type: Date },
  dateOfBaptism: { type: Date },
  dateOfConfirmation: { type: Date },
  dateOfMarriage: { type: Date },
  permanentAddress: { type: String, required: true },
  presentAddress: { type: String, required: true },
  mobileNumber: { type: String, required: true }
}, { timestamps: true });

memberSchema.plugin(AutoIncrement, { inc_field: 'id' });
memberSchema.plugin(AutoIncrement, { inc_field: 'memberNumber', start_seq: 1000 });

module.exports = mongoose.model('Member', memberSchema);
