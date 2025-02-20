const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: {
        id: String,
        username: String,
      },
    job: { type: String, default: null },
    gold: { type: Number, default: 0 },
    lastSalary: { type: Date, default: null },
    criminalRecord: [
        {
            punishmentType: { type: String, required: true },
            amount: { type: Number, required: true },
            reason: { type: String, required: true },
            issuedBy: { type: String, required: true }, // The ID of the user who issued the fine
            issuedAt: { type: Date, default: Date.now } // The timestamp of when the fine was issued
        }
    ],
});

module.exports = mongoose.model('User', userSchema);
