const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: ['admin', 'superadmin'],
		default: 'admin'
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

// Note: it's recommended to hash passwords before saving (e.g., using bcrypt).

module.exports = mongoose.model('Admin', adminSchema);
