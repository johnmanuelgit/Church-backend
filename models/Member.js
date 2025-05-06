const mongoose = require('mongoose');

const MembersSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: String,
  nativeaddress: String,
  currentaddress: String,
  mobilenum: String,
  baptism: String,
  solidifying: String,
  marriagedate: String,
  familyHead: String,
  familyId: String,
  taxPaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Member", MembersSchema);
