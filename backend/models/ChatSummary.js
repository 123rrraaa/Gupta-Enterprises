const mongoose = require('mongoose');

const chatSummarySchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true
    },
    summary: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Order', 'Refund', 'Payment', 'Technical', 'Other'],
        required: true
    },
    sentiment: {
        type: String,
        enum: ['Positive', 'Neutral', 'Negative'],
        required: true
    },
    resolutionStatus: {
        type: String,
        enum: ['Resolved', 'Escalated'],
        required: true
    },
    messageCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatSummary', chatSummarySchema);
