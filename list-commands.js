require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Fetching registered commands from Discord...\n');

        // Fetch guild-specific commands
        const guildCommands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        );

        // Fetch global commands
        const globalCommands = await rest.get(
            Routes.applicationCommands(process.env.CLIENT_ID)
        );

        // Check and display guild commands
        if (guildCommands.length === 0) {
            console.log('❌ No guild commands registered.');
        } else {
            console.log(`📜 Registered Guild Commands (${guildCommands.length}):\n`);
            guildCommands.forEach(cmd => {
                console.log(`🔹 ${cmd.name} - (${cmd.id}) - ${cmd.description || 'No description provided.'}`);
            });
        }

        // Check and display global commands
        if (globalCommands.length === 0) {
            console.log('❌ No global commands registered.');
        } else {
            console.log(`📜 Registered Global Commands (${globalCommands.length}):\n`);
            globalCommands.forEach(cmd => {
                console.log(`🔸 ${cmd.name} - (${cmd.id}) - ${cmd.description || 'No description provided.'}`);
            });
        }

        console.log('\n✅ Command list fetched successfully!');
    } catch (error) {
        console.error('❌ Error fetching commands:', error);
    }
})();
