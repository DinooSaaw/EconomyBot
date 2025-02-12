const GuildSettings = require('../models/Settings');
const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
});
module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        console.log(`📌 Joined new guild: ${guild.name} (${guild.id})`);

        // Check if settings already exist
        let settings = await GuildSettings.findOne({ _id: guild.id });

        if (!settings) {
            settings = new GuildSettings({
                _id: guild.id,
            });

            await settings.save();
            console.log(`[${timestamp}] ✅ Created default settings for ${guild.name} (${guild.id})`);
        }
    }
};
