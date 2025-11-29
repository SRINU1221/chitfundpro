const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    chit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chit',
        required: true,
    },
    month: {
        type: Number,
        required: true,
    },
    // Breakdown for lift-based system
    regularAmount: {
        type: Number,
        default: 20000, // Base monthly contribution
    },
    extraAmount: {
        type: Number,
        default: 0, // Extra 4000 if member has lifted
    },
    totalAmount: {
        type: Number,
        required: true, // regularAmount + extraAmount
    },
    type: {
        type: String,
        enum: ['payment', 'lift'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    paymentMode: {
        type: String,
        enum: ['online', 'cash'],
        default: 'online',
        required: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
    },
}, {
    timestamps: true,
});

// Virtual to check if this is a payment with extra charge
transactionSchema.virtual('hasExtraCharge').get(function () {
    return this.extraAmount > 0;
});

module.exports = mongoose.model('Transaction', transactionSchema);
