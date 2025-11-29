const express = require('express');
const router = express.Router();
const {
    recordPayment,
    getMyTransactions,
    getChitTransactions,
    getOrganizerStats,
    getCurrentMonthDue,
    getPaymentHistory,
    getPaymentStatistics,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, recordPayment);
router.route('/my').get(protect, getMyTransactions);
router.route('/organizer').get(protect, getOrganizerStats);
router.route('/chit/:chitId').get(protect, getChitTransactions);
router.route('/chit/:chitId/current-due').get(protect, getCurrentMonthDue);
router.route('/chit/:chitId/history').get(protect, getPaymentHistory);
router.route('/chit/:chitId/statistics').get(protect, getPaymentStatistics);

module.exports = router;
