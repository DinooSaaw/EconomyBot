const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    _id: String,
    showCriminalRecord: { type: Boolean, default: true },
    showTreasuryBalance: { type: Boolean, default: false },
    tradeNotifications: { type: Boolean, default: true },

    maxCharacters: { type: Number, default: 2 },

    government: {
        allowedRoles: { type: [String], default: [] },
        allowedUsers: { type: [String], default: [] }
    },
    admin: {
        allowedRoles: { type: [String], default: [] },
        allowedUsers: { type: [String], default: [] }
    },
    taxes: {
        incomeTax: { type: Number, default: 10 }, // Default 10% income tax
        gst: { type: Number, default: 5 }, // Default 5% GST
    }
});

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);
