const GuildSettings = require('../models/Settings');

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
            console.log(`✅ Created default settings for ${guild.name} (${guild.id})`);
        }
    }
};
