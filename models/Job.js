const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    basePay: { type: Number, required: true },
    roleId: { type: String, required: false },
    tax: { type: Number, required: false, default: 0 }
});

module.exports = mongoose.model('Job', jobSchema);
