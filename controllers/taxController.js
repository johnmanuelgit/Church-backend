const TaxRecord = require('../models/TaxRecord');
const Member = require('../models/member.model');

// Enhanced markTaxPaid function
exports.markTaxPaid = async (req, res) => {
  try {
    const { memberId, year, amount } = req.body;

    // Validate input
    if (!memberId || !year || amount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const taxRecord = await TaxRecord.findOneAndUpdate(
      { memberId, year },
      { 
        taxPaid: true,
        amount: amount,
        paymentDate: new Date(),
        lastUpdated: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('memberId');

    res.status(200).json(taxRecord);
  } catch (error) {
    console.error('Error marking tax as paid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced markTaxUnpaid function
exports.markTaxUnpaid = async (req, res) => {
  try {
    const { memberId, year } = req.body;

    if (!memberId || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const taxRecord = await TaxRecord.findOneAndUpdate(
      { memberId, year },
      { 
        taxPaid: false,
        paymentDate: null,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    ).populate('memberId');

    if (!taxRecord) {
      return res.status(404).json({ message: 'Tax record not found' });
    }

    res.status(200).json(taxRecord);
  } catch (error) {
    console.error('Error marking tax as unpaid:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced updateTaxAmount function
exports.updateTaxAmount = async (req, res) => {
  try {
    const { memberId, year, amount, taxPaid } = req.body;

    if (!memberId || !year || amount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updateData = {
      amount,
      lastUpdated: new Date()
    };

    if (taxPaid !== undefined) {
      updateData.taxPaid = taxPaid;
      updateData.paymentDate = taxPaid ? new Date() : null;
    }

    const taxRecord = await TaxRecord.findOneAndUpdate(
      { memberId, year },
      updateData,
      { upsert: true, new: true, runValidators: true }
    ).populate('memberId');

    res.status(200).json(taxRecord);
  } catch (error) {
    console.error('Error updating tax amount:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Tax configuration function
exports.updateTaxConfig = async (req, res) => {
  try {
    const { year } = req.params;
    const { config } = req.body;

    if (!year || !config) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate config structure
    if (!config.adult || !config.child || !config.adultAge) {
      return res.status(400).json({ message: 'Invalid config structure' });
    }

    // Here you would typically save to a TaxConfig model
    // For now we'll just return the config
    res.status(200).json({
      year: parseInt(year),
      config,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating tax config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tax records for a specific member
exports.getMemberTaxRecords = async (req, res) => {
  try {
    const { memberId } = req.params;
    const taxRecords = await TaxRecord.find({ memberId }).populate('memberId');
    res.status(200).json(taxRecords);
  } catch (error) {
    console.error('Error getting member tax records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tax records
exports.getAllTaxRecords = async (req, res) => {
  try {
    const taxRecords = await TaxRecord.find().populate('memberId');
    res.status(200).json(taxRecords);
  } catch (error) {
    console.error('Error getting all tax records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tax summary
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
          unpaid: { $subtract: ["$total", "$paid"] },
          count: 1,
          paidCount: 1,
          _id: 0
        }
      },
      { $sort: { year: -1 } }
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting tax summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tax configuration for a specific year
exports.getTaxConfig = async (req, res) => {
  try {
    const { year } = req.params;
    
    // This would typically come from your database
    // For now, returning a default config
    const defaultConfig = {
      adult: 1000,
      child: 500,
      adultAge: 18,
      seniorAge: 60,
      seniorDiscount: 10
    };
    
    res.status(200).json({
      year: parseInt(year),
      config: defaultConfig
    });
  } catch (error) {
    console.error('Error getting tax config:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tax records by year
exports.getTaxRecordsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const taxRecords = await TaxRecord.find({ year }).populate('memberId');
    res.status(200).json(taxRecords);
  } catch (error) {
    console.error('Error getting tax records by year:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete tax record
exports.deleteTaxRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await TaxRecord.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Tax record not found' });
    }
    
    res.status(200).json({ message: 'Tax record deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};