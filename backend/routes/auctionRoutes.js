const express = require('express');
const router = express.Router();
const {
    selectMonthlyWinner,
    getChitDistributions,
    getAvailableMembers,
    getMonthPaymentStatus,
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/select-winner').post(protect, selectMonthlyWinner);
router.route('/chit/:chitId').get(protect, getChitDistributions);
router.route('/chit/:chitId/available-members').get(protect, getAvailableMembers);
router.route('/chit/:chitId/month/:month/status').get(protect, getMonthPaymentStatus);

module.exports = router;
