const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../Models/User.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your gold balance.'),
    async execute(interaction) {
        let user = await User.findOne({ _id: interaction.user.id });
        if (!user) user = await User.create({ _id: interaction.user.id, name: interaction.user.username, gold: 10 });

        const balanceEmbed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color
            .setTitle('💰 Balance Check')
            .setDescription(`**${interaction.user.displayName}**, you have **${user.gold.toLocaleString()}** gold.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Use /salary to collect your salary!', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [balanceEmbed] });
    }
};