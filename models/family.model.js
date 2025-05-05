const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema({
  familyId: { type: String, unique: true }, // e.g. "FAM001"
  familyHeadName: String
});

module.exports = mongoose.model("Family", FamilySchema);
