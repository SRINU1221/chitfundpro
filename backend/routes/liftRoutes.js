const express = require('express');
const router = express.Router();
const {
    selectMonthlyLifter,
    getMonthlyLiftStatus,
    getLiftHistory,
    getMemberLiftStatus,
} = require('../controllers/liftController');
const { protect } = require('../middleware/authMiddleware');

router.route('/select').post(protect, selectMonthlyLifter);
router.route('/chit/:chitId/month/:month/status').get(protect, getMonthlyLiftStatus);
router.route('/chit/:chitId/history').get(protect, getLiftHistory);
router.route('/member/:userId/chit/:chitId/status').get(protect, getMemberLiftStatus);

module.exports = router;
