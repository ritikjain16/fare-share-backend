const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Debt = require('../models/Debt');

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
exports.addExpense = async (req, res) => {
  try {
    const { description, amount, groupId, splitType, participants } = req.body;
    const paidBy = req.user._id;

    // Optional: Validation that participants cover the total amount
    if (splitType === 'equal') {
      const splitAmount = amount / participants.length;
      participants.forEach(p => {
        p.amountOwed = splitAmount;
      });
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      groupId: groupId || null,
      splitType,
      participants
    });

    if (groupId) {
      await Group.findByIdAndUpdate(groupId, {
        $push: { expenses: expense._id }
      });
    }

    // Create debt records for each participant
    const debtPromises = participants.map(async (p) => {
      if (p.user.toString() !== paidBy.toString() && p.amountOwed > 0) {
        return Debt.create({
          from: p.user, // The person who owes
          to: paidBy,   // The person who paid
          amount: p.amountOwed,
          groupId: groupId || null
        });
      }
    });

    await Promise.all(debtPromises);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all expenses involving user
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { 'participants.user': req.user._id }
      ]
    })
    .populate('paidBy', 'name email')
    .populate('participants.user', 'name email')
    .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    if (expense) {
      // Basic auth check
      const isParticipant = expense.participants.some(p => p.user._id.equals(req.user._id));
      const isPayer = expense.paidBy._id.equals(req.user._id);

      if (isParticipant || isPayer) {
        res.json(expense);
      } else {
        res.status(403).json({ message: 'Not authorized to view this expense' });
      }
    } else {
      res.status(404).json({ message: 'Expense not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
