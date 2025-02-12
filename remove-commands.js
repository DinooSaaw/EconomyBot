require('dotenv').config(); // Load environment variables

const { REST, Routes } = require('discord.js');
const { CLIENT_ID, TOKEN, GUILD_ID } = process.env; // Load environment variables

console.log("Client ID:", CLIENT_ID);
console.log("Bot Token:", TOKEN ? 'Loaded' : 'Not Loaded');
console.log("Guild ID:", GUILD_ID ? 'Loaded' : 'Not Loaded');

// Initialize REST client
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔴 Starting the process of deleting all global (/) commands.');

        // Fetch all global slash commands
        const commands = await rest.get(Routes.applicationCommands(CLIENT_ID));
        console.log(`Fetched ${commands.length} global commands.`);

        // Delete each command
        for (const command of commands) {
            await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
            console.log(`🗑️ Deleted command: ${command.name}`);
        }

        console.log('✅ All global (/) commands have been successfully deleted.');
    } catch (error) {
        console.error('❌ Error deleting global commands:', error);
    }
})();
