const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
	items: [{
		product: {
			_id: String,
			name: String,
			brand: String,
			category: String,
			price: Number,
			image: String,
			size: String
		},
		quantity: Number
	}],
	total: {
		type: Number,
		required: true
	},
	deliveryCharge: {
		type: Number,
		default: 0
	},
	address: {
		fullName: String,
		phone: String,
		address: String,
		city: String,
		pincode: String
	},
	paymentMethod: {
		type: String,
		enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'],
		default: 'cash_on_delivery'
	},
	status: {
		type: String,
		enum: ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
		default: 'Confirmed'
	},
	userId: String,
	userEmail: String,
	notes: String,
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Order', orderSchema);
