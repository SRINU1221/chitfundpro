const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const Chit = require('../models/Chit');
const Transaction = require('../models/Transaction');

// @desc    Select monthly winner
// @route   POST /api/auctions/select-winner
// @access  Private (Organizer only)
const selectMonthlyWinner = asyncHandler(async (req, res) => {
    const { chitId, month, winnerId } = req.body;

    const chit = await Chit.findById(chitId).populate('members.user', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Validate month
    if (month < 1 || month > chit.months) {
        res.status(400);
        throw new Error('Invalid month');
    }

    // Check if winner already exists for this month
    const existingDistribution = await Auction.findOne({ chit: chitId, month });
    if (existingDistribution) {
        res.status(400);
        throw new Error('Winner already selected for this month');
    }

    // Check if all approved members have paid for this month
    const approvedMembers = chit.members.filter(m => m.status === 'approved');
    const totalApprovedMembers = approvedMembers.length;

    const paidMembersCount = await Transaction.countDocuments({
        chit: chitId,
        month: month,
        type: 'payment',
        status: 'completed'
    });

    if (paidMembersCount < totalApprovedMembers) {
        res.status(400);
        throw new Error(`Cannot select winner. Only ${paidMembersCount} of ${totalApprovedMembers} members have paid for Month ${month}`);
    }

    // Check if winner has already won in any previous month
    const hasWonBefore = chit.monthlyWinners.some(
        w => w.winner.toString() === winnerId
    );
    if (hasWonBefore) {
        res.status(400);
        throw new Error('This member has already won in a previous month');
    }

    // Validate winner is an approved member
    const isMember = chit.members.some(
        m => m.user._id.toString() === winnerId && m.status === 'approved'
    );
    if (!isMember) {
        res.status(400);
        throw new Error('Winner must be an approved member');
    }

    // Use the already calculated totalApprovedMembers for interest calculation
    if (totalApprovedMembers === 0) {
        res.status(400);
        throw new Error('No approved members in this chit');
    }

    // Dynamic interest calculation: Total Amount / (Total Members * Total Months)
    const interestPerMonth = chit.amount / (totalApprovedMembers * chit.months);

    // Calculate amount using formula
    const remainingMonths = chit.months - month + 1;
    const deduction = interestPerMonth * remainingMonths;
    const amountReceived = chit.amount - deduction;

    // Create distribution record
    const distribution = await Auction.create({
        chit: chitId,
        month,
        winner: winnerId,
        amountReceived,
        deduction,
        status: 'completed',
    });

    // Update chit's monthlyWinners
    chit.monthlyWinners.push({
        month,
        winner: winnerId,
        amountReceived,
        deduction,
    });
    await chit.save();

    // Distribute deduction as dividend to all approved members
    if (deduction > 0) {
        const approvedMembers = chit.members.filter(m => m.status === 'approved');
        const dividendPerMember = deduction / approvedMembers.length;

        const dividendPromises = approvedMembers.map(member => {
            return Transaction.create({
                user: member.user._id,
                chit: chitId,
                amount: dividendPerMember,
                type: 'dividend',
                status: 'completed',
                month: month,
                description: `Dividend from Month ${month} distribution`,
            });
        });

        await Promise.all(dividendPromises);
    }

    const populatedDistribution = await Auction.findById(distribution._id)
        .populate('winner', 'name email')
        .populate('chit', 'name');

    res.status(201).json(populatedDistribution);
});

// @desc    Get monthly distributions for a chit
// @route   GET /api/auctions/chit/:chitId
// @access  Private
const getChitDistributions = asyncHandler(async (req, res) => {
    const distributions = await Auction.find({ chit: req.params.chitId })
        .populate('winner', 'name email')
        .sort('month');

    res.status(200).json(distributions);
});

// @desc    Get available members for selection (who haven't won yet)
// @route   GET /api/auctions/chit/:chitId/available-members
// @access  Private (Organizer only)
const getAvailableMembers = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.chitId).populate('members.user', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Get approved members who haven't won yet
    const winnerIds = chit.monthlyWinners.map(w => w.winner.toString());
    const availableMembers = chit.members
        .filter(m => m.status === 'approved' && !winnerIds.includes(m.user._id.toString()))
        .map(m => ({
            _id: m.user._id,
            name: m.user.name,
            email: m.user.email,
        }));

    res.status(200).json(availableMembers);
});

// @desc    Get payment status for a specific month
// @route   GET /api/auctions/chit/:chitId/month/:month/status
// @access  Private (Organizer only)
const getMonthPaymentStatus = asyncHandler(async (req, res) => {
    const { chitId, month } = req.params;

    const chit = await Chit.findById(chitId);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Get approved members count
    const approvedMembers = chit.members.filter(m => m.status === 'approved');
    const totalMembers = approvedMembers.length;

    // Get paid members count for this month
    const paidMembers = await Transaction.find({
        chit: chitId,
        month: Number(month),
        type: 'payment',
        status: 'completed'
    }).populate('user', 'name email');

    const paidCount = paidMembers.length;

    // Check if winner already selected
    const distribution = await Auction.findOne({ chit: chitId, month: Number(month) });
    const winnerSelected = !!distribution;

    res.status(200).json({
        month: Number(month),
        totalMembers,
        paidCount,
        allPaid: paidCount >= totalMembers,
        winnerSelected,
        paidMembers: paidMembers.map(t => ({
            userId: t.user._id,
            name: t.user.name,
            email: t.user.email,
            amount: t.amount,
            paidAt: t.createdAt
        })),
        readyForDistribution: paidCount >= totalMembers && !winnerSelected
    });
});

module.exports = {
    selectMonthlyWinner,
    getChitDistributions,
    getAvailableMembers,
    getMonthPaymentStatus,
};
