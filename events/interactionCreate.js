module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            return interaction.reply({ content: '❌ Command not found!', ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('❌ Error executing command:', error);
            return interaction.reply({ content: '❌ There was an error executing this command!', ephemeral: true });
        }
    }
};
