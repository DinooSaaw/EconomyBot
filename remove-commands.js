require('dotenv').config(); // Load environment variables

const { REST } = require('discord.js');
const { CLIENT_ID, TOKEN } = process.env; // Assuming you're using environment variables

// Debugging: Check if values are loaded
console.log("Client ID:", CLIENT_ID);
console.log("Bot Token:", TOKEN ? 'Loaded' : 'Not Loaded');

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started deleting all application (/) commands.');

        // Fetch all global slash commands
        const commands = await rest.get(`/applications/${CLIENT_ID}/commands`);
        console.log('Fetched global commands:', commands.length);

        // Delete each command
        for (const command of commands) {
            await rest.delete(`/applications/${CLIENT_ID}/commands/${command.id}`);
            console.log(`Deleted command: ${command.name}`);
        }

        console.log('Successfully deleted all application (/) commands.');
    } catch (error) {
        console.error('Error deleting commands:', error);
    }
})();
