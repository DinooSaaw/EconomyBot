require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Loading commands
fs.readdirSync('./commands').forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
});

// MongoDB connection (removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Ready event
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// Interaction event
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    // Check if command exists
    if (!command) {
        return interaction.reply({
            content: '❌ Command not found!',
            ephemeral: true
        });
    }

    try {
        // Execute command
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        return interaction.reply({
            content: '❌ There was an error while executing this command!',
            ephemeral: true
        });
    }
});

// Login
client.login(process.env.TOKEN);
