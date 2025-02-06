const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    _id: String,
    showCriminalRecord: { type: Boolean, default: true },
    showTreasuryBalance: { type: Boolean, default: false },
    tradeNotifications: { type: Boolean, default: true },

    fine: {
        allowedRoles: { type: [String], default: [] },
        allowedUsers: { type: [String], default: [] }
    },
    government: {
        allowedRoles: { type: [String], default: [] },
        allowedUsers: { type: [String], default: [] }
    },
    admin: {
        allowedRoles: { type: [String], default: [] },
        allowedUsers: { type: [String], default: [] }
    }
});

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);
