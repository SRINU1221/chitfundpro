const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Chit = require('../models/Chit');

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
    const { chitId, month, paymentMode = 'online' } = req.body;

    const chit = await Chit.findById(chitId);
    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Validate sequential payment - check if previous months are paid
    if (month > 1) {
        const previousMonthsPaid = await Transaction.countDocuments({
            user: req.user.id,
            chit: chitId,
            type: 'payment',
            status: 'completed',
            month: { $lt: month }
        });

        if (previousMonthsPaid !== month - 1) {
            res.status(400);
            throw new Error(`Please pay previous months first. You must pay month ${previousMonthsPaid + 1}`);
        }
    }

    // Check if this month is already paid
    const existingPayment = await Transaction.findOne({
        user: req.user.id,
        chit: chitId,
        month,
        type: 'payment',
        status: 'completed'
    });

    if (existingPayment) {
        res.status(400);
        throw new Error('This month is already paid');
    }

    // Calculate payment amount based on lift status
    const regularAmount = chit.monthlyContribution; // 20000
    const extraAmount = chit.calculateExtraAmount(req.user.id, month); // 0 or 4000
    const totalAmount = regularAmount + extraAmount;

    const transaction = await Transaction.create({
        user: req.user.id,
        chit: chitId,
        month,
        regularAmount,
        extraAmount,
        totalAmount,
        type: 'payment',
        status: 'completed',
        paymentMode: paymentMode || 'online',
    });

    res.status(201).json(transaction);
});

// @desc    Get my transactions
// @route   GET /api/payments/my
// @access  Private
const getMyTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ user: req.user.id })
        .populate('chit', 'name')
        .sort('-createdAt');
    res.status(200).json(transactions);
});

// @desc    Get transactions for a chit
// @route   GET /api/chits/:chitId/transactions
// @access  Private (Organizer only)
const getChitTransactions = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.chitId);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is the organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const transactions = await Transaction.find({ chit: req.params.chitId })
        .populate('user', 'name email')
        .populate('chit', 'name')
        .sort('-createdAt');
    res.status(200).json(transactions);
});

// @desc    Get organizer stats (Total collected & member payments)
// @route   GET /api/payments/organizer
// @access  Private
const getOrganizerStats = asyncHandler(async (req, res) => {
    // Find chits organized by this user
    const chits = await Chit.find({ organizer: req.user.id });
    const chitIds = chits.map(chit => chit._id);

    if (chitIds.length === 0) {
        return res.status(200).json({
            totalCollected: 0,
            recentTransactions: []
        });
    }

    // Find all payment transactions for these chits
    const transactions = await Transaction.find({
        chit: { $in: chitIds },
        type: 'payment',
        status: 'completed'
    })
        .populate('user', 'name email')
        .populate('chit', 'name')
        .sort('-createdAt');

    const totalCollected = transactions.reduce((acc, t) => acc + t.amount, 0);

    res.status(200).json({
        totalCollected,
        recentTransactions: transactions
    });
});

// @desc    Get current month due for a participant
// @route   GET /api/payments/chit/:chitId/current-due
// @access  Private
const getCurrentMonthDue = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.chitId);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is a member
    const isMember = chit.members.some(m => m.user && m.user.toString() === req.user.id && m.status === 'approved');
    if (!isMember) {
        res.status(401);
        throw new Error('You are not an approved member of this chit');
    }

    // Find all paid months
    const paidMonths = await Transaction.find({
        user: req.user.id,
        chit: req.params.chitId,
        type: 'payment',
        status: 'completed'
    }).select('month').sort('month');

    const paidMonthNumbers = paidMonths.map(t => t.month);

    // Find the first unpaid month
    let currentDueMonth = 1;
    for (let i = 1; i <= chit.totalMonths; i++) {
        if (!paidMonthNumbers.includes(i)) {
            currentDueMonth = i;
            break;
        }
    }

    // Check if all months are paid
    if (paidMonthNumbers.length === chit.totalMonths) {
        return res.status(200).json({
            allPaid: true,
            currentMonth: null,
            regularAmount: null,
            extraAmount: null,
            totalAmount: null,
            totalMonths: chit.totalMonths,
            paidMonths: paidMonthNumbers.length
        });
    }

    // Check if user is up to date (paid up to current chit month)
    if (currentDueMonth > chit.currentMonth) {
        return res.status(200).json({
            allPaid: false,
            upToDate: true, // New flag
            currentMonth: null, // No payment due right now
            regularAmount: null,
            extraAmount: null,
            totalAmount: null,
            totalMonths: chit.totalMonths,
            paidMonths: paidMonthNumbers.length
        });
    }

    // Calculate amount based on lift status
    const regularAmount = chit.monthlyContribution; // 20000
    const extraAmount = chit.calculateExtraAmount(req.user.id, currentDueMonth); // 0 or 4000
    const totalAmount = regularAmount + extraAmount;

    // Get member's lift status
    const member = chit.members.find(m => m.user && m.user.toString() === req.user.id);
    const hasLifted = member ? member.hasLifted : false;
    const liftedInMonth = member ? member.liftedInMonth : null;

    res.status(200).json({
        allPaid: false,
        upToDate: false,
        currentMonth: currentDueMonth,
        regularAmount,
        extraAmount,
        totalAmount,
        hasLifted,
        liftedInMonth,
        totalMonths: chit.totalMonths,
        paidMonths: paidMonthNumbers.length
    });
});

// @desc    Get payment history for a chit
// @route   GET /api/payments/chit/:chitId/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.chitId);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is a member
    const isMember = chit.members.some(m => m.user && m.user.toString() === req.user.id);
    if (!isMember) {
        res.status(401);
        throw new Error('You are not a member of this chit');
    }

    // Get all payment transactions for this user and chit
    const payments = await Transaction.find({
        user: req.user.id,
        chit: req.params.chitId,
        type: 'payment'
    }).sort('month');

    // Create complete history for all months
    const history = [];
    for (let month = 1; month <= chit.totalMonths; month++) {
        const payment = payments.find(p => p.month === month);

        if (payment) {
            history.push({
                month,
                status: 'paid',
                amount: payment.totalAmount,
                extraAmount: payment.extraAmount || 0,
                date: payment.createdAt,
                transactionId: payment._id
            });
        } else {
            // Check if this is the current due month
            const paidMonths = payments.filter(p => p.status === 'completed').map(p => p.month);
            const isNextUnpaid = month === (paidMonths.length + 1);

            // It is only "due" if it is the next unpaid month AND it is <= chit.currentMonth
            const isDue = isNextUnpaid && month <= chit.currentMonth;
            const isLocked = !isDue; // Future months or skipped months

            history.push({
                month,
                status: isDue ? 'due' : 'locked',
                amount: chit.monthlyContribution, // Estimate
                extraAmount: 0, // Estimate
                date: null,
                transactionId: null
            });
        }
    }

    res.status(200).json(history);
});

// @desc    Get payment statistics by mode for a chit
// @route   GET /api/payments/chit/:chitId/statistics
// @access  Private (Organizer only)
const getPaymentStatistics = asyncHandler(async (req, res) => {
    const { chitId } = req.params;

    const chit = await Chit.findById(chitId);
    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized - Only organizer can view statistics');
    }

    // Get all completed payments for this chit for the CURRENT MONTH
    const payments = await Transaction.find({
        chit: chitId,
        month: chit.currentMonth,
        type: 'payment',
        status: 'completed'
    });

    // Calculate statistics - treat undefined/null paymentMode as 'online' for backward compatibility
    const onlinePayments = payments.filter(p => !p.paymentMode || p.paymentMode === 'online');
    const cashPayments = payments.filter(p => p.paymentMode === 'cash');

    const totalOnline = onlinePayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCash = cashPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalCollected = totalOnline + totalCash;

    // Disable caching for this endpoint to ensure fresh data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
        month: chit.currentMonth,
        totalCollected,
        totalOnline,
        totalCash,
        onlineCount: onlinePayments.length,
        cashCount: cashPayments.length,
        totalPayments: payments.length
    });
});

module.exports = {
    recordPayment,
    getMyTransactions,
    getChitTransactions,
    getOrganizerStats,
    getCurrentMonthDue,
    getPaymentHistory,
    getPaymentStatistics,
};
