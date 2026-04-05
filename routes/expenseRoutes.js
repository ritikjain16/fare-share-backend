const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, getExpenseById } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addExpense);
router.get('/', protect, getExpenses);
router.get('/:id', protect, getExpenseById);

module.exports = router;
