const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Payment', 'Refund', 'Agent Request', 'Other'],
        required: true
    },
    customerMessage: {
        type: String,
        required: true
    },
    aiResponse: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
