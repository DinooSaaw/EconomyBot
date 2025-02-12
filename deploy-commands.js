require('dotenv').config(); // Load environment variables
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const registeredCommands = new Set(); // Track unique command names

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    const commandName = command.data.name;

    if (registeredCommands.has(commandName)) {
        console.warn(`⚠️ Duplicate command detected: "${commandName}" in file ${file}. Skipping.`);
        continue; // Skip duplicate commands
    }

    console.log(`Registering command: ${commandName}`);
    registeredCommands.add(commandName);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔴 Starting the registration of global commands...');

        // Register global slash commands
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

        console.log('✅ Global commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering global commands:', error);
    }
})();
