const asyncHandler = require('express-async-handler');
const Chit = require('../models/Chit');
const Transaction = require('../models/Transaction');

// Helper to calculate monthly pool details
const calculateMonthlyDetails = (chit, month) => {
    // Base collection from all members
    // Assuming all members pay. In reality, it depends on approved members count.
    // For projection, we use totalMembers from schema or actual approved count.
    const approvedMembersCount = chit.members.filter(m => m.status === 'approved').length;
    const baseCollection = chit.monthlyContribution * approvedMembersCount;

    // Extra collection from previous lifters
    // Previous lifters are those who lifted in months < current month
    const previousLiftersCount = chit.lifts.filter(l => l.month < month).length;
    const extraCollection = previousLiftersCount * chit.extraChargePerMonth;

    const totalPool = baseCollection + extraCollection;
    const commission = chit.commission || 0;
    const lifterPayout = totalPool - commission;

    return {
        baseCollection,
        extraCollection,
        totalPool,
        commission,
        lifterPayout
    };
};

// @desc    Select monthly lifter
// @route   POST /api/lifts/select
// @access  Private (Organizer only)
const selectMonthlyLifter = asyncHandler(async (req, res) => {
    const { chitId, month, memberId } = req.body;

    const chit = await Chit.findById(chitId).populate('members.user', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized - Only organizer can select lifter');
    }

    // Validate month
    if (month < 1 || month > chit.totalMonths) {
        res.status(400);
        throw new Error(`Invalid month. Must be between 1 and ${chit.totalMonths}`);
    }

    // Check if lifter already selected for this month
    const existingLift = chit.lifts.find(lift => lift.month === month);
    if (existingLift) {
        res.status(400);
        throw new Error(`Lifter already selected for Month ${month}`);
    }

    // Check if all approved members have paid for this month
    const approvedMembers = chit.members.filter(m => m.status === 'approved');
    const totalApprovedMembers = approvedMembers.length;

    if (totalApprovedMembers === 0) {
        res.status(400);
        throw new Error('No approved members in this chit');
    }

    const paidMembersCount = await Transaction.countDocuments({
        chit: chitId,
        month: month,
        type: 'payment',
        status: 'completed'
    });

    if (paidMembersCount < totalApprovedMembers) {
        res.status(400);
        throw new Error(`Cannot select lifter. Only ${paidMembersCount} of ${totalApprovedMembers} members have paid for Month ${month}`);
    }

    // Check if member has already lifted
    if (chit.hasMemberLifted(memberId)) {
        res.status(400);
        throw new Error('This member has already lifted in a previous month');
    }

    // Validate member is approved
    const member = chit.members.find(m =>
        m.user._id.toString() === memberId && m.status === 'approved'
    );
    if (!member) {
        res.status(400);
        throw new Error('Member must be an approved participant');
    }

    // Calculate lift details dynamically
    const { totalPool, commission, lifterPayout } = calculateMonthlyDetails(chit, month);

    const remainingMonths = chit.totalMonths - month; // Months after this one
    const extraDueTotal = remainingMonths * chit.extraChargePerMonth; // e.g., 11 * 4000 = 44000

    // Add lift record
    chit.lifts.push({
        month,
        member: memberId,
        month,
        member: memberId,
        liftAmount: lifterPayout, // Store the actual payout
        poolAmount: totalPool, // Optional: if schema supports it, otherwise it's just calculated
        commission: commission, // Optional
        extraDueTotal,
        extraPerMonth: chit.extraChargePerMonth,
        remainingMonths,
        liftedAt: new Date()
    });

    // Update member's lift status
    member.hasLifted = true;
    member.liftedInMonth = month;

    await chit.save();

    // Populate the lift details for response
    const updatedChit = await Chit.findById(chitId)
        .populate('lifts.member', 'name email')
        .populate('members.user', 'name email');

    const liftDetails = updatedChit.lifts.find(l => l.month === month);

    res.status(201).json({
        message: `${member.user.name} selected as lifter for Month ${month}`,
        lift: liftDetails,
        chit: updatedChit
    });
});

// @desc    Get monthly lift status
// @route   GET /api/lifts/chit/:chitId/month/:month/status
// @access  Private (Organizer only)
const getMonthlyLiftStatus = asyncHandler(async (req, res) => {
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

    // Get paid members for this month
    const paidMembers = await Transaction.find({
        chit: chitId,
        month: Number(month),
        type: 'payment',
        status: 'completed'
    }).populate('user', 'name email');

    const paidCount = paidMembers.length;

    // Check if lifter already selected
    const lift = chit.lifts.find(l => l.month === Number(month));
    const lifterSelected = !!lift;

    // Get members who haven't lifted yet
    const availableMembers = approvedMembers.filter(m => !m.hasLifted);

    // Calculate actual collected amount for this month

    const monthTransactions = await Transaction.find({
        chit: chitId,
        month: Number(month),
        type: 'payment',
        status: 'completed'
    });

    const actualCollected = monthTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Calculate projected details for this month
    const projections = calculateMonthlyDetails(chit, Number(month));

    res.status(200).json({
        month: Number(month),
        totalMembers,
        paidCount,
        allPaid: paidCount >= totalMembers,
        lifterSelected,
        lift: lift || null,
        availableMembers: availableMembers.map(m => ({
            userId: m.user,
            hasLifted: m.hasLifted
        })),
        readyForLiftSelection: paidCount >= totalMembers && !lifterSelected,
        // Add projections and actuals
        currentMonthCollected: actualCollected,
        projectedPool: projections.totalPool,
        projectedCommission: projections.commission,
        projectedPayout: projections.lifterPayout,
        extraCollected: projections.extraCollection
    });
});

// @desc    Get all lifts for a chit
// @route   GET /api/lifts/chit/:chitId/history
// @access  Private
const getLiftHistory = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.chitId)
        .populate('lifts.member', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    res.status(200).json(chit.lifts);
});

// @desc    Get member's lift status
// @route   GET /api/lifts/member/:userId/chit/:chitId/status
// @access  Private
const getMemberLiftStatus = asyncHandler(async (req, res) => {
    const { userId, chitId } = req.params;

    const chit = await Chit.findById(chitId);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    const member = chit.members.find(m => m.user.toString() === userId);

    if (!member) {
        res.status(404);
        throw new Error('Member not found in this chit');
    }

    const liftDetails = chit.getMemberLiftDetails(userId);

    res.status(200).json({
        hasLifted: member.hasLifted,
        liftedInMonth: member.liftedInMonth,
        liftDetails: liftDetails || null,
        extraPerMonth: liftDetails ? chit.extraChargePerMonth : 0
    });
});

module.exports = {
    selectMonthlyLifter,
    getMonthlyLiftStatus,
    getLiftHistory,
    getMemberLiftStatus,
};
