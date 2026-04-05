const Debt = require('../models/Debt');
const { simplifyDebts } = require('../utils/simplifyDebts');
const mongoose = require('mongoose');

// @desc    Get simplified debts for a group
// @route   GET /api/settle/group/:groupId
// @access  Private
exports.getSimplifiedGroupDebts = async (req, res) => {
  try {
    // Only get unsettled debts
    const debts = await Debt.find({ 
      groupId: req.params.groupId,
      isSettled: false
    });

    const simplifiedDebts = simplifyDebts(debts);
    
    // We could populate user info manually here if needed
    
    res.json(simplifiedDebts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unified dashboard balances
// @route   GET /api/settle/dashboard
// @access  Private
exports.getDashboardBalances = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Debts where user owes money (from = user)
    const userOwes = await Debt.aggregate([
      { $match: { from: userId, isSettled: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // 2. Debts where user is owed money (to = user)
    const userOwed = await Debt.aggregate([
      { $match: { to: userId, isSettled: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalOwes = userOwes.length > 0 ? userOwes[0].total : 0;
    const totalOwed = userOwed.length > 0 ? userOwed[0].total : 0;

    res.json({
      totalOwes,
      totalOwed,
      netBalance: totalOwed - totalOwes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Settle a specific amount between two users
// @route   POST /api/settle
// @access  Private
exports.settleDebt = async (req, res) => {
  try {
    const { from, to, amount, groupId } = req.body;
    
    // Mark specific debts as settled or add a negative expense
    // Simple approach: mark all outstanding debts from -> to as settled
    // Or complex approach: reduce outstanding debts up to amount.
    
    // Complex approach:
    const debtsToSettle = await Debt.find({
      from,
      to,
      isSettled: false,
      ...(groupId && { groupId })
    }).sort('createdAt');

    let remainingAmountToSettle = amount;

    for (const debt of debtsToSettle) {
      if (remainingAmountToSettle <= 0) break;

      if (debt.amount <= remainingAmountToSettle) {
        debt.isSettled = true;
        remainingAmountToSettle -= debt.amount;
        await debt.save();
      } else {
        // Partial settlement
        debt.amount -= remainingAmountToSettle;
        await debt.save();
        remainingAmountToSettle = 0;
      }
    }

    res.json({ message: 'Debt settled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
