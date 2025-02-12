const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    basePay: { type: Number, required: true },
    roleId: { type: String, required: false }
});

module.exports = mongoose.model('Job', jobSchema);
