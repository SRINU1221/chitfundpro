const asyncHandler = require('express-async-handler');
const Chit = require('../models/Chit');

// @desc    Create new chit group
// @route   POST /api/chits
// @access  Private/Admin
const createChit = asyncHandler(async (req, res) => {
    const { name, totalMembers, monthlyContribution, totalMonths, extraChargePerMonth, commission, startDate } = req.body;

    if (!name || !totalMembers || !monthlyContribution || !totalMonths || !startDate) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Validate values
    if (totalMembers < 2 || totalMembers > 100) {
        res.status(400);
        throw new Error('Total members must be between 2 and 100');
    }

    if (monthlyContribution < 1000) {
        res.status(400);
        throw new Error('Monthly contribution must be at least ₹1,000');
    }

    if (totalMonths < 3 || totalMonths > 60) {
        res.status(400);
        throw new Error('Duration must be between 3 and 60 months');
    }

    const chit = await Chit.create({
        name,
        totalMembers,
        monthlyContribution,
        totalMonths,
        extraChargePerMonth: extraChargePerMonth || 0,
        commission: commission || 0,
        startDate,
        organizer: req.user.id,
        currentMonth: 1,
        lifts: [],
        members: [],
    });

    res.status(201).json(chit);
});

// @desc    Get all chits
// @route   GET /api/chits
// @access  Private
const getChits = asyncHandler(async (req, res) => {
    const chits = await Chit.find();
    res.status(200).json(chits);
});

// @desc    Get single chit
// @route   GET /api/chits/:id
// @access  Private
const getChit = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id).populate('members.user', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Auto-cleanup: Remove members whose user account no longer exists
    const validMembers = chit.members.filter(m => m.user);
    if (validMembers.length !== chit.members.length) {
        chit.members = validMembers;
        await chit.save();
    }

    res.status(200).json(chit);
});

// @desc    Join a chit
// @route   POST /api/chits/:id/join
// @access  Private
const joinChit = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Allow joining if open OR (active and has space)
    if (chit.status !== 'open' && chit.status !== 'active') {
        res.status(400);
        throw new Error('Chit is not open for joining');
    }

    // Check if already a member
    const alreadyMember = chit.members.find(
        (member) => member.user.toString() === req.user.id
    );

    if (alreadyMember) {
        res.status(400);
        throw new Error('Already requested to join or joined');
    }

    if (chit.members.length >= chit.totalMembers) {
        res.status(400);
        throw new Error('Chit is full');
    }

    chit.members.push({ user: req.user.id });
    await chit.save();

    res.status(200).json(chit);
});

// @desc    Update member status (Approve/Reject)
// @route   PUT /api/chits/:id/members/:userId
// @access  Private/Admin
const updateMemberStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const member = chit.members.find(
        (m) => m.user.toString() === req.params.userId
    );

    if (!member) {
        res.status(404);
        throw new Error('Member not found in this chit');
    }

    member.status = status;
    await chit.save();

    res.status(200).json(chit);
});

// @desc    Start a chit (Change status to active)
// @route   PUT /api/chits/:id/start
// @access  Private/Organizer
const startChit = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (chit.status !== 'open') {
        res.status(400);
        throw new Error('Chit is not open');
    }

    chit.status = 'active';
    await chit.save();

    res.status(200).json(chit);
});

// @desc    Update chit
// @route   PUT /api/chits/:id
// @access  Private (Organizer only)
const updateChit = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const { name, amount, months, totalMembers, interestPerMonth, startDate } = req.body;

    // Update fields if provided
    if (name) chit.name = name;
    if (amount) {
        chit.amount = amount;
        chit.installment = amount / (months || chit.months);
    }
    if (months) {
        chit.months = months;
        chit.installment = (amount || chit.amount) / months;
    }
    if (totalMembers) chit.totalMembers = totalMembers;
    if (interestPerMonth !== undefined) chit.interestPerMonth = interestPerMonth;
    if (startDate) chit.startDate = startDate;

    const updatedChit = await chit.save();
    res.status(200).json(updatedChit);
});

// @desc    Delete chit
// @route   DELETE /api/chits/:id
// @access  Private (Organizer only)
const deleteChit = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Delete related data
    const Auction = require('../models/Auction');
    const Transaction = require('../models/Transaction');

    await Auction.deleteMany({ chit: req.params.id });
    await Transaction.deleteMany({ chit: req.params.id });
    await Chit.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Chit deleted successfully', id: req.params.id });
});

// @desc    Remove member from chit
// @route   DELETE /api/chits/:id/members/:userId
// @access  Private (Organizer only)
const removeMember = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id);

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Remove member from array
    chit.members = chit.members.filter(
        member => member.user.toString() !== req.params.userId
    );

    await chit.save();

    // Delete member's transactions for this chit
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({
        chit: req.params.id,
        user: req.params.userId
    });

    const updatedChit = await Chit.findById(req.params.id).populate('members.user', 'name email');
    res.status(200).json(updatedChit);
});

// @desc    Advance chit to next month
// @route   POST /api/chits/:id/advance-month
// @access  Private (Organizer only)
const advanceToNextMonth = asyncHandler(async (req, res) => {
    const chit = await Chit.findById(req.params.id).populate('members.user', 'name email');

    if (!chit) {
        res.status(404);
        throw new Error('Chit not found');
    }

    // Check if user is organizer
    if (chit.organizer.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized - Only organizer can advance month');
    }

    // Check if chit has started
    if (chit.status !== 'active') {
        res.status(400);
        throw new Error('Chit must be active to advance month');
    }

    // Check if already at last month
    if (chit.currentMonth >= chit.totalMonths) {
        res.status(400);
        throw new Error('Chit has already completed all months');
    }

    // Validate: All approved members have paid for current month
    const Transaction = require('../models/Transaction');
    const approvedMembers = chit.members.filter(m => m.status === 'approved');

    const currentMonthPayments = await Transaction.find({
        chit: req.params.id,
        month: chit.currentMonth,
        type: 'payment',
        status: 'completed'
    });

    const paidMemberIds = currentMonthPayments.map(t => t.user.toString());
    const unpaidMembers = approvedMembers.filter(m => !paidMemberIds.includes(m.user._id.toString()));

    if (unpaidMembers.length > 0) {
        res.status(400);
        throw new Error(`Cannot advance month: ${unpaidMembers.length} member(s) have not paid yet`);
    }

    // Validate: Lifter has been selected for current month
    const hasLifter = chit.lifts.some(lr => lr.month === chit.currentMonth);
    if (!hasLifter) {
        res.status(400);
        throw new Error('Cannot advance month: Lifter has not been selected for current month');
    }

    // Advance to next month
    chit.currentMonth += 1;

    // If reached last month, mark as completed
    if (chit.currentMonth > chit.totalMonths) {
        chit.status = 'completed';
    }

    await chit.save();

    const updatedChit = await Chit.findById(req.params.id).populate('members.user', 'name email');
    res.status(200).json(updatedChit);
});

module.exports = {
    createChit,
    getChits,
    getChit,
    joinChit,
    updateMemberStatus,
    startChit,
    updateChit,
    deleteChit,
    removeMember,
    advanceToNextMonth,
};
