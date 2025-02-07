require('dotenv').config(); // Load environment variables

const { REST, Routes } = require('discord.js');
const { CLIENT_ID, TOKEN, GUILD_ID } = process.env; // Load environment variables

console.log("Client ID:", CLIENT_ID);
console.log("Bot Token:", TOKEN ? 'Loaded' : 'Not Loaded');
console.log("Guild ID:", GUILD_ID ? 'Loaded' : 'Not Loaded');

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔴 Started deleting all guild (/) commands.');

        // Fetch all guild slash commands
        const commands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));
        console.log(`Fetched ${commands.length} guild commands.`);

        // Delete each command
        for (const command of commands) {
            await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
            console.log(`🗑️ Deleted guild command: ${command.name}`);
        }

        console.log('✅ Successfully deleted all guild (/) commands.');
    } catch (error) {
        console.error('❌ Error deleting guild commands:', error);
    }
})();
