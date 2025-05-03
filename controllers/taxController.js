const TaxRecord = require('../models/TaxRecord');
const mongoose = require('mongoose');

exports.markAsPaid = async (req, res) => {
  try {
    const { memberId, year, amount } = req.body;
    const numericYear = Number(year);

    const objectId = new mongoose.Types.ObjectId(memberId);
    let record = await TaxRecord.findOne({ memberId: objectId, year: numericYear });

    if (!record) {
      record = new TaxRecord({ memberId: objectId, year: numericYear, taxPaid: true, amount });
    } else {
      record.taxPaid = true;
      record.amount = amount;
    }

    await record.save();
    res.json({ message: 'Marked as paid', record });
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
};

exports.markAsUnpaid = async (req, res) => {
  try {
    const { memberId, year } = req.body;
    const numericYear = Number(year);

    const record = await TaxRecord.findOne({ memberId, year: numericYear });

    if (!record) {
      return res.status(404).json({ error: 'Tax record not found' });
    }

    record.taxPaid = false;
    await record.save();
    res.json({ message: 'Marked as unpaid', record });
  } catch (error) {
    console.error('Error in markAsUnpaid:', error);
    res.status(500).json({ error: 'Failed to mark as unpaid' });
  }
};

exports.getAllTaxRecords = async (req, res) => {
  try {
    const records = await TaxRecord.find();
    res.json(records);
  } catch (error) {
    console.error('Error fetching tax records:', error);
    res.status(500).json({ error: 'Failed to load tax records' });
  }
};

exports.getTaxSummary = async (req, res) => {
  try {
    const summary = await TaxRecord.aggregate([
      {
        $group: {
          _id: "$year",
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          year: "$_id",
          total: 1,
          _id: 0
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
