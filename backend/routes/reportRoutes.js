const express = require('express');
const router = express.Router();
const { generateMonthlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.route('/chit/:chitId/month/:month/pdf').get(protect, generateMonthlyReport);

module.exports = router;
