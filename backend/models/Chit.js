const mongoose = require('mongoose');

const chitSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a chit name'],
    },
    // Fixed values for lift-based system
    totalMembers: {
        type: Number,
        default: 21,
        required: true,
    },
    monthlyContribution: {
        type: Number,
        default: 20000,
        required: true,
    },
    totalMonths: {
        type: Number,
        default: 21,
        required: true,
    },
    extraChargePerMonth: {
        type: Number,
        default: 4000,
        required: true,
    },
    commission: {
        type: Number,
        default: 8000, // Fixed commission for organizer
        required: true,
    },
    currentMonth: {
        type: Number,
        default: 1,
    },
    startDate: {
        type: Date,
        required: [true, 'Please add a start date'],
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        hasLifted: {
            type: Boolean,
            default: false,
        },
        liftedInMonth: {
            type: Number,
            default: null,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    lifts: [{
        month: {
            type: Number,
            required: true,
        },
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        liftAmount: {
            type: Number,
            required: true, // 20000 * 21 = 420000
        },
        extraDueTotal: {
            type: Number,
            required: true, // (21 - month) * 4000
        },
        extraPerMonth: {
            type: Number,
            default: 4000,
        },
        remainingMonths: {
            type: Number,
            required: true, // 21 - month
        },
        liftedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    status: {
        type: String,
        enum: ['open', 'active', 'completed'],
        default: 'open',
    },
}, {
    timestamps: true,
});

// Virtual for total lift amount (always 420000)
chitSchema.virtual('totalLiftAmount').get(function () {
    return this.monthlyContribution * this.totalMonths;
});

// Method to check if a member has lifted
chitSchema.methods.hasMemberLifted = function (userId) {
    return this.lifts.some(lift => lift.member.toString() === userId.toString());
};

// Method to get member's lift details
chitSchema.methods.getMemberLiftDetails = function (userId) {
    return this.lifts.find(lift => lift.member.toString() === userId.toString());
};

// Method to calculate extra amount for a member
chitSchema.methods.calculateExtraAmount = function (userId, currentMonth) {
    const liftDetails = this.getMemberLiftDetails(userId);
    if (!liftDetails) return 0;

    // If member lifted before or in current month, they pay extra
    if (liftDetails.month <= currentMonth) {
        return this.extraChargePerMonth;
    }
    return 0;
};

module.exports = mongoose.model('Chit', chitSchema);
