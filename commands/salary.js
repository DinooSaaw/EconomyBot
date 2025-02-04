const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../Models/User');
const Job = require('../Models/Job');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('salary')
        .setDescription('Receive your weekly job payment.'),
    async execute(interaction) {
        let user = await User.findOne({ _id: interaction.user.id });

        if (!user || !user.job) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000') // Red for error
                        .setTitle('❌ Salary Failed')
                        .setDescription("You don't have a job!")
                        .setFooter({ text: 'Make sure you have a job assigned.', iconURL: interaction.client.user.displayAvatarURL() })
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        // Fetch job data from the database
        const job = await Job.findOne({ name: user.job });
        if (!job) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000') // Red for error
                        .setTitle('❌ Job Not Found')
                        .setDescription(`Your job (**${user.job}**) is not recognized. Contact an admin.`)
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if user already received salary this week
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

        // Convert lastSalary from string to a timestamp (milliseconds)
        const lastSalaryTimestamp = user.lastSalary ? new Date(user.lastSalary).getTime() : 0;

        if (lastSalaryTimestamp && now - lastSalaryTimestamp < oneWeek) {
            const nextSalary = lastSalaryTimestamp + oneWeek;
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF9900') // Yellow for cooldown
                        .setTitle('⏳ Salary Not Ready')
                        .setDescription(`You already claimed your salary this week!`)
                        .addFields({ name: 'Next Salary Available', value: `<t:${Math.floor(nextSalary / 1000)}:F>` })
                        .setFooter({ text: 'Salary resets once per week.', iconURL: interaction.client.user.displayAvatarURL() })
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        // Grant salary and update last salary timestamp
        const salary = job.basePay;
        user.gold += salary;
        user.lastSalary = new Date().toISOString(); // Store current timestamp in ISO format
        await user.save();

        const salaryEmbed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color
            .setTitle('💰 Salary!')
            .setDescription(`**${interaction.user.displayName}**, you received **${salary}** gold for working as a **${user.job}**.`)
            .addFields(
                { name: 'Base Salary', value: `**${job.basePay.toLocaleString()}** gold`, inline: true },
                { name: 'Total Received', value: `**${salary.toLocaleString()}** gold`, inline: true },
                { name: 'New Balance', value: `**${user.gold.toLocaleString()}** gold`, inline: true },
                { name: 'Next Salary Available', value: `<t:${Math.floor((now + oneWeek) / 1000)}:F>`, inline: false }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Keep working hard for more gold!', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [salaryEmbed] });
    }
};
