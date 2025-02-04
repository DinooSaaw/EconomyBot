const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    basePay: { type: Number, required: true }
});

module.exports = mongoose.model('Job', jobSchema);
