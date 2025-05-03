const Member = require('../models/Member');

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
