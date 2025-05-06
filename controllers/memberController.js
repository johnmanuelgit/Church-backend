const Member = require('../models/Member');
const Family = require('../models/family.model');


exports.getAll = async (req, res) => {
  const members = await Member.find();
  res.json(members);
};

exports.create = async (req, res) => {
  const member = new Member(req.body);
  await member.save();
  res.status(201).json(member);
};

exports.update = async (req, res) => {
  const updated = await Member.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
  updated ? res.json(updated) : res.status(404).json({ message: 'Member not found' });
};

exports.remove = async (req, res) => {
  await Member.deleteOne({ id: req.params.id });
  res.status(204).send();
};


function generateFamilyId(name) {
  const prefix = name.substring(0, 3).toUpperCase();
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `${prefix}${randomDigits}`;
}

exports.create = async (req, res) => {
  try {
    let { name, familyHead } = req.body;
    let familyId = req.body.familyId;

    if (name === familyHead) {
      // If this member is the family head, generate familyId and save to Family collection
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
      // Lookup familyId from familyHead's member record
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