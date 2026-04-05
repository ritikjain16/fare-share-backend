const express = require('express');
const router = express.Router();
const { getSimplifiedGroupDebts, getDashboardBalances, settleDebt } = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/group/:groupId', protect, getSimplifiedGroupDebts);
router.get('/dashboard', protect, getDashboardBalances);
router.post('/', protect, settleDebt);

module.exports = router;
