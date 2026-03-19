const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	brand: {
		type: String,
		required: true,
		lowercase: true
	},
	category: {
		type: String,
		required: true,
		lowercase: true
	},
	size: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	originalPrice: {
		type: Number
	},
	image: {
		type: String,
		required: true
	},
	description: {
		type: String
	},
	inStock: {
		type: Boolean,
		default: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Product', productSchema);
