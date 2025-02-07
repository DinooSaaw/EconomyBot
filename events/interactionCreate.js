module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const user = interaction.user.tag;
        const guild = interaction.guild ? interaction.guild.name : 'DMs';
        const channel = interaction.channel ? `#${interaction.channel.name}` : 'Direct Message';

        console.log(`📩 Received command: /${interaction.commandName} from ${user} in ${guild} (${channel})`);

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.warn(`⚠️ Command not found: ${interaction.commandName} (User: ${user}, Location: ${guild} - ${channel})`);
            return interaction.reply({ content: '❌ Command not found!', ephemeral: true });
        }

        try {
            console.log(`▶️ Executing command: /${interaction.commandName} by ${user} in ${guild} (${channel})`);
            await command.execute(interaction);
            console.log(`✅ Successfully executed command: /${interaction.commandName} by ${user} in ${guild} (${channel})`);
        } catch (error) {
            console.error(`❌ Error executing command: /${interaction.commandName} by ${user} in ${guild} (${channel}) -`, error);
            return interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
        }
    }
};
