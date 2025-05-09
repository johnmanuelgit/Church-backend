const Member = require('../models/member.model');

// Helper: Generate formatted family ID
function generateFamilyId(name) {
  const namePrefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3-digit random number
  return `${namePrefix}${randomDigits}`;
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
    delete memberData.formattedParentId; // Remove any formattedParentId from request

    // If it's a head of family (no parentId), generate a new family ID
    if (!memberData.parentId) {
      memberData.parentId = generateFamilyId(memberData.name);
    }

    const newMember = new Member(memberData);
    const savedMember = await newMember.save();

    // Add formattedParentId to response for family heads
    const response = savedMember.toObject();
    if (!memberData.parentId || savedMember.parentId === response.parentId) {
      response.formattedParentId = savedMember.parentId;
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: 'Error creating member', error: error.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const memberData = { ...req.body };

    ['dateOfBirth', 'dateOfBaptism', 'dateOfConfirmation', 'dateOfMarriage'].forEach(field => {
      if (memberData[field]) memberData[field] = new Date(memberData[field]);
    });

    delete memberData._id;
    delete memberData.id;
    delete memberData.memberNumber;
    delete memberData.formattedParentId; // Remove any formattedParentId from request

    const updatedMember = await Member.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      memberData,
      { new: true }
    );

    if (!updatedMember) return res.status(404).json({ message: 'Member not found' });

    // Add formattedParentId to response for family heads
    const response = updatedMember.toObject();
    if (!memberData.parentId || updatedMember.parentId === response.parentId) {
      response.formattedParentId = updatedMember.parentId;
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: 'Error updating member', error: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    // First check if this is a family head with members
    const member = await Member.findOne({ id: parseInt(req.params.id) });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // If this is a family head, check for dependent members
    if (member.parentId === null || await Member.findOne({ parentId: member.parentId })) {
      const dependentMembers = await Member.find({ parentId: member.parentId });
      if (dependentMembers.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete a family head with dependent members. Please reassign or delete dependent members first.'
        });
      }
    }

    const deletedMember = await Member.findOneAndDelete({ id: parseInt(req.params.id) });
    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting member', error: error.message });
  }
};

exports.getFamilyMembers = async (req, res) => {
  try {
    const familyMembers = await Member.find({ parentId: req.params.headId });
    res.status(200).json(familyMembers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching family members', error: error.message });
  }
};

exports.getFamilyHeads = async (req, res) => {
  try {
    const heads = await Member.find({ parentId: null });

    const headsWithFormattedId = heads.map(head => {
      const headObj = head.toObject();  // convert Mongoose doc to plain JS
      headObj.formattedParentId = `FAM-${headObj._id.toString().slice(-4)}`;
      return headObj;
    });

    res.status(200).json(headsWithFormattedId);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching family heads', error: error.message });
  }
};

