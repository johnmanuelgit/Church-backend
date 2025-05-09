const TaxRecord = require('../models/TaxRecord');
const Member = require('../models/member.model'); // Ensure correct path
const mongoose = require('mongoose');

// Calculate default tax amount based on age
function calculateDefaultTax(dateOfBirth) {
  if (!dateOfBirth) return 1000; // Default if no DOB
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  const adjustedAge = m < 0 || (m === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
  
  return adjustedAge < 18 ? 500 : 1000;
}

exports.markAsPaid = async (req, res) => {
  try {
    const { memberId, year, amount } = req.body;
    const numericYear = Number(year);

    const objectId = new mongoose.Types.ObjectId(memberId);
    let record = await TaxRecord.findOne({ memberId: objectId, year: numericYear });

    if (!record) {
      // Get member's DOB to calculate default amount if not provided
      let taxAmount = amount;
      if (!taxAmount) {
        const member = await Member.findById(objectId);
        taxAmount = calculateDefaultTax(member?.dateOfBirth);
      }
      
      record = new TaxRecord({
        memberId: objectId,
        year: numericYear,
        taxPaid: true,
        amount: taxAmount,
        lastUpdated: new Date()
      });
    } else {
      record.taxPaid = true;
      if (amount) record.amount = amount;
      record.lastUpdated = new Date();
    }

    await record.save();
    res.json({ message: 'Marked as paid', record });
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    res.status(500).json({ error: 'Failed to mark as paid', details: error.message });
  }
};

exports.markAsUnpaid = async (req, res) => {
  try {
    const { memberId, year } = req.body;
    const numericYear = Number(year);
    const objectId = memberId instanceof mongoose.Types.ObjectId ? memberId : new mongoose.Types.ObjectId(memberId);

    const record = await TaxRecord.findOne({ memberId: objectId, year: numericYear });

    if (!record) {
      return res.status(404).json({ error: 'Tax record not found' });
    }

    record.taxPaid = false;
    record.lastUpdated = new Date();
    await record.save();
    res.json({ message: 'Marked as unpaid', record });
  } catch (error) {
    console.error('Error in markAsUnpaid:', error);
    res.status(500).json({ error: 'Failed to mark as unpaid', details: error.message });
  }
};

// New endpoint to update tax amount
exports.updateTaxAmount = async (req, res) => {
  try {
    const { memberId, year, amount, taxPaid } = req.body;
    const numericYear = Number(year);
    const numericAmount = Number(amount);
    
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ error: 'Invalid tax amount' });
    }

    const objectId = new mongoose.Types.ObjectId(memberId);
    let record = await TaxRecord.findOne({ memberId: objectId, year: numericYear });

    if (!record) {
      record = new TaxRecord({
        memberId: objectId,
        year: numericYear,
        taxPaid: !!taxPaid,
        amount: numericAmount,
        lastUpdated: new Date()
      });
    } else {
      record.amount = numericAmount;
      if (taxPaid !== undefined) record.taxPaid = taxPaid;
      record.lastUpdated = new Date();
    }

    await record.save();
    res.json({ message: 'Tax amount updated', record });
  } catch (error) {
    console.error('Error updating tax amount:', error);
    res.status(500).json({ error: 'Failed to update tax amount', details: error.message });
  }
};

exports.getAllTaxRecords = async (req, res) => {
  try {
    const records = await TaxRecord.find().populate('memberId', 'name dateOfBirth');
    res.json(records);
  } catch (error) {
    console.error('Error fetching tax records:', error);
    res.status(500).json({ error: 'Failed to load tax records' });
  }
};

exports.getMemberTaxRecords = async (req, res) => {
  try {
    const { memberId } = req.params;
    const objectId = new mongoose.Types.ObjectId(memberId);
    const records = await TaxRecord.find({ memberId: objectId }).sort({ year: 1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching member tax records:', error);
    res.status(500).json({ error: 'Failed to load member tax records' });
  }
};

exports.getTaxSummary = async (req, res) => {
  try {
    const summary = await TaxRecord.aggregate([
      {
        $group: {
          _id: "$year",
          total: { $sum: "$amount" },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$taxPaid", true] }, "$amount", 0]
            }
          },
          unpaid: {
            $sum: {
              $cond: [{ $eq: ["$taxPaid", false] }, "$amount", 0]
            }
          },
          count: { $sum: 1 },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$taxPaid", true] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          year: "$_id",
          total: 1,
          paid: 1,
          unpaid: 1,
          count: 1,
          paidCount: 1,
          _id: 0
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
};
