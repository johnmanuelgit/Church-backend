const Member = require('../models/Member');
const Family = require('../models/family.model');

// Utility to generate a unique family ID
function generateFamilyId(name) {
  const prefix = name.substring(0, 3).toUpperCase();
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randomDigits}`;
}

// GET all members
exports.getAll = async (req, res) => {
  try {
    const members = await Member.find();
    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
};

// POST create new member
exports.create = async (req, res) => {
  try {
    let { name, familyHead } = req.body;
    let familyId = req.body.familyId;

    if (name === familyHead) {
      // Generate new familyId and save to Family collection
      familyId = generateFamilyId(name);

      const existingFamily = await Family.findOne({ familyHeadName: name });
      if (!existingFamily) {
        const newFamily = new Family({
          familyId,
          familyHeadName: name
        });
        await newFamily.save();
      }
    } else {
      // Use familyId from existing family head
      const headMember = await Member.findOne({ name: familyHead });
      if (headMember) {
        familyId = headMember.familyId;
      } else {
        return res.status(400).json({ message: 'Family head not found' });
      }
    }

    const member = new Member({ ...req.body, familyId });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ message: 'Failed to create member' });
  }
};

// PUT update member
exports.update = async (req, res) => {
  try {
    const memberId = req.params.id;

    const updated = await Member.findByIdAndUpdate(memberId, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Failed to update member' });
  }
};

// DELETE member
exports.remove = async (req, res) => {
  try {
    const memberId = req.params.id;

    const deleted = await Member.findByIdAndDelete(memberId);

    if (!deleted) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Failed to delete member' });
  }
};
