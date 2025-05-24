const Member = require('../models/member.model');
const TaxRate = require('../models/taxRate.model');
const TaxPayment = require('../models/taxPayment.model');
const { Parser } = require('json2csv');

// Helper function to regenerate tax payments when rates change
async function regenerateTaxPaymentsForYear(year) {
  try {
    console.log('Regenerating tax payments for year:', year);
    
    // Get updated tax rates
    const taxRate = await TaxRate.findOne({ year });
    if (!taxRate) {
      console.log('No tax rates found for year:', year);
      return;
    }
    
    // Get all existing tax payments for the year
    const existingPayments = await TaxPayment.find({ year }).populate('memberId');
    
    // Update tax amounts based on new rates
    for (const payment of existingPayments) {
      if (payment.memberId) {
        const age = calculateAge(payment.memberId.dateOfBirth);
        const newTaxAmount = age >= taxRate.adultAgeThreshold ? taxRate.adultTax : taxRate.childTax;
        
        // Only update if the amount changed and payment is not yet paid
        if (payment.taxAmount !== newTaxAmount) {
          payment.taxAmount = newTaxAmount;
          
          // If payment was partially paid and new amount is different, adjust paid amount
          if (payment.isPaid && payment.paidAmount !== newTaxAmount) {
            payment.paidAmount = newTaxAmount;
          }
          
          await payment.save();
          console.log(`Updated payment for member ${payment.memberId.name}: ${payment.taxAmount}`);
        }
      }
    }
    
    console.log('Completed regenerating tax payments');
  } catch (error) {
    console.error('Error regenerating tax payments:', error);
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Get tax rates for a specific year
exports.getTaxRates = async (req, res) => {
  try {
    const { year } = req.params;
    let taxRate = await TaxRate.findOne({ year: parseInt(year) });
    
    // If no tax rate exists for the year, create default one
    if (!taxRate) {
      taxRate = new TaxRate({
        year: parseInt(year),
        adultTax: 1000,
        childTax: 500,
        adultAgeThreshold: 18,
        isActive: true
      });
      await taxRate.save();
    }
    
    res.status(200).json(taxRate);
  } catch (error) {
    console.error('Error getting tax rates:', error);
    res.status(500).json({ message: 'Error fetching tax rates', error: error.message });
  }
};

// Update tax rates for a specific year
exports.updateTaxRates = async (req, res) => {
  try {
    const { year } = req.params;
    const { adultTax, childTax, adultAgeThreshold } = req.body;
    
    console.log('Updating tax rates for year:', year);
    console.log('New rates:', { adultTax, childTax, adultAgeThreshold });
    
    // Validate input
    if (!adultTax || adultTax <= 0) {
      return res.status(400).json({ message: 'Adult tax must be greater than 0' });
    }
    
    if (childTax < 0) {
      return res.status(400).json({ message: 'Child tax must be 0 or greater' });
    }
    
    if (!adultAgeThreshold || adultAgeThreshold < 1 || adultAgeThreshold > 100) {
      return res.status(400).json({ message: 'Adult age threshold must be between 1 and 100' });
    }
    
    const updatedTaxRate = await TaxRate.findOneAndUpdate(
      { year: parseInt(year) },
      {
        adultTax: Number(adultTax),
        childTax: Number(childTax),
        adultAgeThreshold: Number(adultAgeThreshold),
        isActive: true
      },
      { new: true, upsert: true }
    );
    
    console.log('Updated tax rate:', updatedTaxRate);
    
    // After updating rates, regenerate tax payments to reflect new amounts
    await regenerateTaxPaymentsForYear(parseInt(year));
    
    res.status(200).json(updatedTaxRate);
  } catch (error) {
    console.error('Error updating tax rates:', error);
    res.status(500).json({ message: 'Error updating tax rates', error: error.message });
  }
};

// Generate tax payments for all members for a specific year
exports.generateTaxPayments = async (req, res) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    // Get tax rates for the year
    let taxRate = await TaxRate.findOne({ year: yearInt });
    if (!taxRate) {
      // Create default tax rate if it doesn't exist
      taxRate = new TaxRate({
        year: yearInt,
        adultTax: 1000,
        childTax: 500,
        adultAgeThreshold: 18,
        isActive: true
      });
      await taxRate.save();
    }
    
    // Get all members
    const members = await Member.find({});
    
    // Check which members already have tax payments for this year
    const existingPayments = await TaxPayment.find({ year: yearInt });
    const existingMemberIds = existingPayments.map(payment => payment.memberId.toString());
    
    // Generate tax payments for members who don't have payments yet
    const taxPayments = [];
    
    for (const member of members) {
      // Skip if payment already exists for this member and year
      if (existingMemberIds.includes(member._id.toString())) {
        continue;
      }
      
      const age = calculateAge(member.dateOfBirth);
      const taxAmount = age >= taxRate.adultAgeThreshold ? taxRate.adultTax : taxRate.childTax;
      
      taxPayments.push({
        memberId: member._id,
        year: yearInt,
        taxAmount,
        isPaid: false,
        paidAmount: 0,
        familyId: member.familyId || 'UNKNOWN'
      });
    }
    
    // Insert new tax payments
    if (taxPayments.length > 0) {
      await TaxPayment.insertMany(taxPayments);
    }
    
    res.status(200).json({ 
      message: `Generated ${taxPayments.length} new tax payments for year ${year}`,
      newPayments: taxPayments.length,
      existingPayments: existingPayments.length
    });
  } catch (error) {
    console.error('Error generating tax payments:', error);
    res.status(500).json({ message: 'Error generating tax payments', error: error.message });
  }
};

// Get tax summary for a specific year and optional family
exports.getTaxSummary = async (req, res) => {
  try {
    const { year, familyId } = req.query;
    const yearInt = parseInt(year);
    
    // Build query filter
    const filter = { year: yearInt };
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get all tax payments for the year/family
    const taxPayments = await TaxPayment.find(filter);
    
    // Calculate summary statistics
    const totalMembers = taxPayments.length;
    const paidMembers = taxPayments.filter(payment => payment.isPaid).length;
    const unpaidMembers = totalMembers - paidMembers;
    const collectionRate = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;
    
    const totalTaxAmount = taxPayments.reduce((sum, payment) => sum + payment.taxAmount, 0);
    const paidTaxAmount = taxPayments.reduce((sum, payment) => 
      sum + (payment.isPaid ? payment.paidAmount : 0), 0);
    const unpaidTaxAmount = totalTaxAmount - paidTaxAmount;
    
    const summary = {
      year: yearInt,
      totalMembers,
      paidMembers,
      unpaidMembers,
      collectionRate,
      totalTaxAmount,
      paidTaxAmount,
      unpaidTaxAmount,
      total: totalMembers
    };
    
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting tax summary:', error);
    res.status(500).json({ message: 'Error fetching tax summary', error: error.message });
  }
};

// NEW: Get tax summary for all years
exports.getAllYearsSummary = async (req, res) => {
  try {
    const { familyId } = req.query;
    
    // Build query filter
    const filter = {};
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get all tax payments
    const taxPayments = await TaxPayment.find(filter);
    
    // Group by year
    const yearlyData = {};
    
    taxPayments.forEach(payment => {
      const year = payment.year;
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          totalMembers: 0,
          paidMembers: 0,
          unpaidMembers: 0,
          totalTaxAmount: 0,
          paidTaxAmount: 0,
          unpaidTaxAmount: 0
        };
      }
      
      const yearData = yearlyData[year];
      yearData.totalMembers++;
      yearData.totalTaxAmount += payment.taxAmount;
      
      if (payment.isPaid) {
        yearData.paidMembers++;
        yearData.paidTaxAmount += payment.paidAmount;
      } else {
        yearData.unpaidMembers++;
        yearData.unpaidTaxAmount += payment.taxAmount;
      }
    });
    
    // Calculate collection rates and convert to array
    const summaryArray = Object.values(yearlyData).map(yearData => ({
      ...yearData,
      collectionRate: yearData.totalMembers > 0 ? 
        Math.round((yearData.paidMembers / yearData.totalMembers) * 100) : 0,
      total: yearData.totalMembers
    }));
    
    // Sort by year descending
    summaryArray.sort((a, b) => b.year - a.year);
    
    res.status(200).json(summaryArray);
  } catch (error) {
    console.error('Error getting all years summary:', error);
    res.status(500).json({ message: 'Error fetching all years summary', error: error.message });
  }
};

// Get detailed member tax information for a specific year
exports.getMemberTaxDetails = async (req, res) => {
  try {
    const { year, familyId } = req.query;
    const yearInt = parseInt(year);
    
    // Build query filter
    const filter = { year: yearInt };
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get tax payments with member details
    const taxPayments = await TaxPayment.find(filter)
      .populate('memberId', 'name dateOfBirth familyId isHeadOfFamily')
      .sort({ 'memberId.name': 1 });
    
    // Transform data for frontend
    const memberDetails = taxPayments.map(payment => {
      const member = payment.memberId;
      if (!member) return null;
      
      const age = calculateAge(member.dateOfBirth);
      
      return {
        _id: payment._id,
        name: member.name,
        age,
        dateOfBirth: member.dateOfBirth,
        taxAmount: payment.taxAmount,
        isPaid: payment.isPaid,
        paidAmount: payment.paidAmount,
        paidDate: payment.paidDate,
        familyId: payment.familyId,
        isHeadOfFamily: member.isHeadOfFamily,
        status: payment.isPaid ? 'Paid' : 'Unpaid',
        year: payment.year
      };
    }).filter(detail => detail !== null);
    
    res.status(200).json(memberDetails);
  } catch (error) {
    console.error('Error getting member tax details:', error);
    res.status(500).json({ message: 'Error fetching member tax details', error: error.message });
  }
};

// NEW: Get detailed member tax information for all years
exports.getAllYearsMemberDetails = async (req, res) => {
  try {
    const { familyId } = req.query;
    
    // Build query filter
    const filter = {};
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get tax payments with member details for all years
    const taxPayments = await TaxPayment.find(filter)
      .populate('memberId', 'name dateOfBirth familyId isHeadOfFamily')
      .sort({ year: -1, 'memberId.name': 1 });
    
    // Transform data for frontend
    const memberDetails = taxPayments.map(payment => {
      const member = payment.memberId;
      if (!member) return null;
      
      const age = calculateAge(member.dateOfBirth);
      
      return {
        _id: payment._id,
        name: member.name,
        age,
        dateOfBirth: member.dateOfBirth,
        taxAmount: payment.taxAmount,
        isPaid: payment.isPaid,
        paidAmount: payment.paidAmount,
        paidDate: payment.paidDate,
        familyId: payment.familyId,
        isHeadOfFamily: member.isHeadOfFamily,
        status: payment.isPaid ? 'Paid' : 'Unpaid',
        year: payment.year
      };
    }).filter(detail => detail !== null);
    
    res.status(200).json(memberDetails);
  } catch (error) {
    console.error('Error getting all years member tax details:', error);
    res.status(500).json({ message: 'Error fetching all years member tax details', error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { isPaid, paidAmount, paymentMethod } = req.body;
    
    const updateData = {
      isPaid,
      paidAmount: isPaid ? paidAmount : 0,
      paymentMethod: paymentMethod || 'cash'
    };
    
    if (isPaid) {
      updateData.paidDate = new Date();
    } else {
      updateData.paidDate = null;
    }
    
    const updatedPayment = await TaxPayment.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    );
    
    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }
    
    res.status(200).json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
};

// Get family heads for dropdown
exports.getFamilyHeads = async (req, res) => {
  try {
    const familyHeads = await Member.find({ isFamilyHead: true })
      .select('_id name familyId')
      .sort({ name: 1 });

    res.status(200).json(familyHeads);
  } catch (error) {
    console.error('Error fetching family heads:', error);
    res.status(500).json({ message: 'Error fetching family heads', error: error.message });
  }
};

// Get available years that have tax data
exports.getAvailableYears = async (req, res) => {
  try {
    const years = await TaxPayment.distinct('year');
    const sortedYears = years.sort((a, b) => b - a); // Sort years descending

    res.status(200).json(sortedYears);
  } catch (error) {
    console.error('Error fetching available years:', error);
    res.status(500).json({ message: 'Error fetching available years', error: error.message });
  }
};

// Export tax report for specific year
exports.exportTaxReport = async (req, res) => {
  try {
    const { year, familyId } = req.query;
    const yearInt = parseInt(year);
    
    // Build query filter
    const filter = { year: yearInt };
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get detailed tax information
    const taxPayments = await TaxPayment.find(filter)
      .populate('memberId', 'name dateOfBirth familyId isHeadOfFamily mobileNumber permanentAddress')
      .sort({ 'memberId.name': 1 });
    
    // Format data for export
    const reportData = taxPayments.map(payment => {
      const member = payment.memberId;
      if (!member) return null;
      
      const age = calculateAge(member.dateOfBirth);
      
      return {
        'Year': payment.year,
        'Member Name': member.name,
        'Family ID': payment.familyId,
        'Age': age,
        'Tax Amount': payment.taxAmount,
        'Status': payment.isPaid ? 'Paid' : 'Unpaid',
        'Paid Amount': payment.paidAmount,
        'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '',
        'Payment Method': payment.paymentMethod || '',
        'Mobile Number': member.mobileNumber || '',
        'Address': member.permanentAddress || '',
        'Is Family Head': member.isHeadOfFamily ? 'Yes' : 'No'
      };
    }).filter(item => item !== null);
    
    res.status(200).json({
      message: 'Report generated successfully',
      year: yearInt,
      familyFilter: familyId || 'All Members',
      totalRecords: reportData.length,
      data: reportData
    });
  } catch (error) {
    console.error('Error exporting tax report:', error);
    res.status(500).json({ message: 'Error exporting tax report', error: error.message });
  }
};

// NEW: Export tax report for all years
exports.exportAllYearsReport = async (req, res) => {
  try {
    const { familyId } = req.query;
    
    // Build query filter
    const filter = {};
    if (familyId && familyId !== 'All Members') {
      filter.familyId = familyId;
    }
    
    // Get detailed tax information for all years
    const taxPayments = await TaxPayment.find(filter)
      .populate('memberId', 'name dateOfBirth familyId isHeadOfFamily mobileNumber permanentAddress')
      .sort({ year: -1, 'memberId.name': 1 });
    
    // Format data for export
    const reportData = taxPayments.map(payment => {
      const member = payment.memberId;
      if (!member) return null;
      
      const age = calculateAge(member.dateOfBirth);
      
      return {
        'Year': payment.year,
        'Member Name': member.name,
        'Family ID': payment.familyId,
        'Age': age,
        'Tax Amount': payment.taxAmount,
        'Status': payment.isPaid ? 'Paid' : 'Unpaid',
        'Paid Amount': payment.paidAmount,
        'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '',
        'Payment Method': payment.paymentMethod || '',
        'Mobile Number': member.mobileNumber || '',
        'Address': member.permanentAddress || '',
        'Is Family Head': member.isHeadOfFamily ? 'Yes' : 'No'
      };
    }).filter(item => item !== null);
    
    res.status(200).json({
      message: 'All years report generated successfully',
      familyFilter: familyId || 'All Members',
      totalRecords: reportData.length,
      data: reportData
    });
  } catch (error) {
    console.error('Error exporting all years tax report:', error);
    res.status(500).json({ message: 'Error exporting all years tax report', error: error.message });
  }
};