const mongoose = require('mongoose');

const MembersSchema = new mongoose.Schema({
  id: Number,
  name: String,
  dob: String,
  nativeaddress: String,
  currentaddress: String,
  mobilenum: String,
  baptism: String,
  solidifying: String,
  familyHead: String,
  // familyId: String,
  taxPaid: { type: Boolean, default: false }
});

module.exports = mongoose.model("MembersDetails", MembersSchema);
