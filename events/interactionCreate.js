module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const user = interaction.user.tag;
        const guild = interaction.guild ? interaction.guild.name : 'Direct Messages';
        const channel = interaction.channel ? `#${interaction.channel.name}` : 'DMs';
        const timestamp = new Date().toISOString();

        // Log full command including options/arguments
        let commandDetails = '';
        if (interaction.options.data && interaction.options.data.length > 0) {
            commandDetails = interaction.options.data
                .map(option => {
                    // Check if the option has nested options (like 'view_user')
                    if (option.options && option.options.length > 0) {
                        return `${option.name}:${option.options.map(opt => `${opt.name}:${opt.value}`).join(', ')}`;
                    }
                    // If it's a simple option
                    const value = option.value ? option.value : 'No value provided';
                    return `${option.name}:${value}`;
                })
                .join(', ');
        } else {
            commandDetails = 'No options';
        }

        console.log(`[${timestamp}] 📩 Received command: /${interaction.commandName} ${commandDetails} from ${user} in ${guild} (${channel})`);

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.warn(`[${timestamp}] ⚠️ Command not found: /${interaction.commandName} (${commandDetails}) (User: ${user}, Location: ${guild} - ${channel})`);
            return interaction.reply({ content: '❌ Command not found!', ephemeral: true });
        }

        try {
            console.log(`[${timestamp}] ▶️ Executing command: /${interaction.commandName} ${commandDetails} by ${user} in ${guild} (${channel})`);
            await command.execute(interaction);
            console.log(`[${timestamp}] ✅ Successfully executed command: /${interaction.commandName} ${commandDetails} by ${user} in ${guild} (${channel})`);
        } catch (error) {
            console.error(`[${timestamp}] ❌ Error executing command: /${interaction.commandName} ${commandDetails} by ${user} in ${guild} (${channel}) -`, error);
            return interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
        }
    }
};
