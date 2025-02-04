// Models/Shop.js
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: { type: String, required: true },
    maxEmployees: { type: Number, required: true }, // Maximum number of employees allowed
    employees: { type: [String], default: [] }, // Array to store employee IDs
    weeklyPay: { type: Number, required: true },
    governmentPayments: { type: Number, required: true },
    governmentTaxes: { type: Number, required: true },
    owner: { id: { type: String }, name: { type: String } }, // Use String for ID if it’s a user ID
});

module.exports = mongoose.model('Shop', shopSchema);
