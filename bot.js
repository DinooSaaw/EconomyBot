require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');

const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.events = new Collection();

// Load commands
fs.readdirSync('./commands').forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
});

// Load events
fs.readdirSync('./events').forEach(file => {
    if (!file.endsWith('.js')) return;
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(`[${timestamp}] ✅ Successfully connected to MongoDB`))
    .catch((err) => console.error(`[${timestamp}] ❌ MongoDB connection error:`, err));

// Login
client.login(process.env.TOKEN);