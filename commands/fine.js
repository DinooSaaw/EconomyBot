const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../Models/User');

const ALLOWED_USER_IDS = ['', '']; // Replace with authorized user IDs
const ALLOWED_ROLE_IDS = ['739331042552578180', '']; // Replace with authorized role IDs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fine')
        .setDescription('Fine a user by deducting gold from their balance. Can result in negative balance.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to fine')
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
        const executor = interaction.user;
        const member = interaction.member;
        const targetUser = interaction.options.getUser('target');
        const fineAmount = interaction.options.getInteger('amount');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if executor has permission (via user ID or role)
        if (!ALLOWED_USER_IDS.includes(executor.id) && 
            !member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id))) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000') // Red for error
                        .setTitle('❌ Access Denied')
                        .setDescription('You do not have permission to fine users.')
                ],
                ephemeral: true
            });
        }

        let target = await User.findOne({ _id: targetUser.id });
        if (!target) {
            target = await User.create({ _id: targetUser.id, name: targetUser.username });
        }

        // Deduct fine (can result in negative balance)
        target.gold -= fineAmount;

        // Push the fine to the fines array
        target.criminalRecord.push({
            punishmentType: 'Fine',
            amount: fineAmount,
            reason: reason,
            issuedBy: `${executor.displayName} (${executor.username})`,
            issuedAt: new Date()
        });

        // Save the user document
        await target.save();

        // Fine Confirmation Embed
        const fineEmbed = new EmbedBuilder()
            .setColor('#FFA500') // Orange for penalties
            .setTitle('📜 Fine Issued')
            .setDescription(`**${executor.displayName }** has fined **${targetUser.displayName }**.`)
            .addFields(
                { name: 'Amount', value: `**${fineAmount.toLocaleString()}** gold`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'New Balance', value: `**${target.gold.toLocaleString()}** gold`, inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Fines must be justified and fair.', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [fineEmbed] });
    }
};
