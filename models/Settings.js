const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema({
    _id: String,
    showCriminalRecord: { type: Boolean, default: true },
    showUsersBalance: { type: Boolean, default: true },
    showTreasuryBalance: { type: Boolean, default: true },
    tradeNotifications: { type: Boolean, default: true }
});

module.exports = model('GuildSettings', guildSettingsSchema);
