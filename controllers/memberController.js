const Member = require('../models/member.model');

// Helper: Generate formatted family ID based on name and mobile number
function generateFamilyId(name, mobileNumber) {
  // Get first 3 letters of name (uppercase)
  const namePrefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  // Get last 3 digits of mobile number
  const mobilePostfix = mobileNumber.slice(-3);
  return `${namePrefix}${mobilePostfix}`;
}

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ name: 1 });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findOne({ id: parseInt(req.params.id) });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching member', error: error.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const memberData = { ...req.body };

    ['dateOfBirth', 'dateOfBaptism', 'dateOfConfirmation', 'dateOfMarriage'].forEach(field => {
      if (memberData[field]) memberData[field] = new Date(memberData[field]);
    });

    delete memberData.id;
    delete memberData.memberNumber;

    // If this is a family head, generate a family ID if not provided
    if (memberData.isHeadOfFamily && !memberData.familyId) {
      memberData.familyId = generateFamilyId(memberData.name, memberData.mobileNumber);
    }

    const newMember = new Member(memberData);
    const savedMember = await newMember.save();

    res.status(201).json(savedMember);
  } catch (error) {
    res.status(400).json({ message: 'Error creating member', error: error.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const memberData = { ...req.body };
    const memberId = parseInt(req.params.id);

    ['dateOfBirth', 'dateOfBaptism', 'dateOfConfirmation', 'dateOfMarriage'].forEach(field => {
      if (memberData[field]) memberData[field] = new Date(memberData[field]);
    });

    delete memberData._id;
    delete memberData.id;
    delete memberData.memberNumber;

    // If family head and familyId is not provided, generate one
    if (memberData.isHeadOfFamily && !memberData.familyId) {
      memberData.familyId = generateFamilyId(memberData.name, memberData.mobileNumber);
    }

    const originalMember = await Member.findOne({ id: memberId });
    if (!originalMember) return res.status(404).json({ message: 'Member not found' });

    const updatedMember = await Member.findOneAndUpdate(
      { id: memberId },
      memberData,
      { new: true }
    );

    // If this is a family head and the familyId changed, update all family members
    if (memberData.isHeadOfFamily && originalMember.familyId !== updatedMember.familyId) {
      await Member.updateMany(
        { familyId: originalMember.familyId, isHeadOfFamily: false },
        { familyId: updatedMember.familyId }
      );
    }

    res.status(200).json(updatedMember);
  } catch (error) {
    res.status(400).json({ message: 'Error updating member', error: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findOne({ id: parseInt(req.params.id) });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // If this is a family head, check for dependent members
    if (member.isHeadOfFamily) {
      const dependentMembers = await Member.countDocuments({ 
        familyId: member.familyId, 
        isHeadOfFamily: false 
      });
      
      if (dependentMembers > 0) {
        return res.status(400).json({
          message: 'Cannot delete a family head with dependent members. Please reassign or delete dependent members first.'
        });
      }
    }

    await Member.findOneAndDelete({ id: parseInt(req.params.id) });
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member', error: error.message });
  }
};

exports.getFamilyMembers = async (req, res) => {
  try {
    const familyMembers = await Member.find({ familyId: req.params.familyId });
    res.status(200).json(familyMembers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching family members', error: error.message });
  }
};

exports.getFamilyHeads = async (req, res) => {
  try {
    const heads = await Member.find({ isHeadOfFamily: true });
    res.status(200).json(heads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching family heads', error: error.message });
  }
};

exports.searchByFamilyId = async (req, res) => {
  try {
    const { familyId } = req.params;
    const members = await Member.find({ familyId });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error searching by family ID', error: error.message });
  }
};