require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Fetching registered commands from Discord...\n');

        const commands = await rest.get(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) // Fetch guild-specific commands
        );

        if (commands.length === 0) {
            console.log('❌ No commands registered.');
        } else {
            console.log(`📜 Registered Commands (${commands.length}):\n`);
            commands.forEach(cmd => {
                console.log(`🔹 ${cmd.name} - (${cmd.id}) - ${cmd.description || 'No description provided.'}`);
            });
        }

        console.log('\n✅ Command list fetched successfully!');
    } catch (error) {
        console.error('❌ Error fetching commands:', error);
    }
})();
