const mongoose = require('mongoose');

const FamilySchema = new mongoose.Schema({
  familyId: { type: String, required: true, unique: true },
  familyHeadName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Family", FamilySchema);
