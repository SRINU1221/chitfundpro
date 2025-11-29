const mongoose = require('mongoose');

const auctionSchema = mongoose.Schema({
    chit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chit',
        required: true,
    },
    month: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending',
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    amountReceived: {
        type: Number,
    },
    deduction: {
        type: Number,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Auction', auctionSchema);
