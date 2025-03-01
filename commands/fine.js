const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../models/User');
const allowedJobs = ["Guards", "Dragons", "Royals"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fine')
        .setDescription('Fine a user by deducting gold from their balance. Can result in negative balance.')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('The character to fine')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of gold to fine')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the fine')
                .setRequired(false)),
    async execute(interaction) {

        const owner = {
            id: interaction.user.id,
            username: interaction.user.username,
        };

        const executor = await User.findOne({ owner, job: { $in: allowedJobs }});

        const targetName = interaction.options.getString('target');
        const fineAmount = Math.ceil(interaction.options.getInteger('amount'));
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!executor) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000') // Red for error
                        .setTitle('❌ Access Denied')
                        .setDescription('You do not have a character with the permissions to fine users.')
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        let target = await User.findOne({ name: targetName });
        let treasury = await User.findOne({ name: "Treasury" });
        if (!target) {
            return interaction.reply({
              content: `❌ Character **${characterName}** not found.`,
              flags: MessageFlags.Ephemeral
            });
          }

        // Deduct fine (can result in negative balance)
        target.gold -= fineAmount;
        treasury.gold += fineAmount;

        // Push the fine to the fines array
        target.criminalRecord.push({
            punishmentType: 'Fine',
            amount: fineAmount,
            reason: reason,
            issuedBy: `${executor.name}`,
            issuedAt: new Date()
        });

        // Save the user document
        await target.save();
        await treasury.save();

        // Fine Confirmation Embed
        const fineEmbed = new EmbedBuilder()
            .setColor('#FFA500') // Orange for penalties
            .setTitle('📜 Fine Issued')
            .setDescription(`**${executor.name}** has fined **${target.name}**.`) // replace with executor character name
            .addFields(
                { name: 'Amount', value: `**${fineAmount.toLocaleString()}** gold`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'New Balance', value: `**${target.gold.toLocaleString()}** gold`, inline: true }
            )
            .setFooter({ text: 'Fines must be justified and fair.', iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [fineEmbed] });
    }
};
