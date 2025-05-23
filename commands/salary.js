const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../models/User');
const Job = require('../models/Job');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('salary')
        .setDescription('Receive your weekly job payment for a specific character.')
        .addStringOption(option => 
            option.setName('character_name')
                .setDescription('The name of your character')
                .setRequired(true)
        ),
    async execute(interaction) {

        const characterName = interaction.options.getString('character_name');
        let user = await User.findOne({ name: characterName });

        if (!user || !user.job) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000') // Red for error
                        .setTitle('❌ Salary Failed')
                        .setDescription("Character not found or the character doesn't have a job!")
                        .setFooter({ text: 'Make sure the character exists and has a job assigned.', iconURL: interaction.client.user.displayAvatarURL() })
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        const owner = {
            id: interaction.user.id,
            username: interaction.user.username,
          };
      
          // Check if the user is the owner of the character
          if (user.owner.id !== owner.id) {
            return interaction.reply({
              content: "❌ You can only claim the salary's of character you own.",
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
                        .setDescription(`The job (**${user.job}**) of your character (**${characterName}**) is not recognized. Contact an admin or dev.`)
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
                        .setDescription(`Your character has already claimed salary this week!`)
                        .addFields({ name: 'Next Salary Available', value: `<t:${Math.floor(nextSalary / 1000)}:F>` })
                        .setFooter({ text: 'Salary resets once per week.', iconURL: interaction.user.displayAvatarURL() })
                ],
                flags: MessageFlags.Ephemeral
            });
        }

        // Grant salary and update last salary timestamp
        const tax = job.tax || 0;
        const salary = job.basePay - tax;
        user.gold += salary; // Subtract tax from salary
        user.lastSalary = new Date().toISOString(); // Store current timestamp in ISO format

        let treasury = await User.findOne({ name: "Treasury" });
        treasury.gold += tax; // Add tax to treasury
        await user.save();
        await treasury.save();

        const salaryEmbed = new EmbedBuilder()
            .setColor('#FFD700') // Gold color
            .setTitle('💰 Salary!')
            .setDescription(`**${characterName}**, you received **${salary}** gold for working as a **${user.job}**.`)
            .addFields(
                { name: 'Base Salary', value: `**${job.basePay.toLocaleString()}** gold`, inline: true },
                { name: 'After Tax', value: `**${salary.toLocaleString()}** gold`, inline: true },
                { name: 'New Balance', value: `**${user.gold.toLocaleString()}** gold`, inline: true },
                { name: 'Next Salary Available', value: `<t:${Math.floor((now + oneWeek) / 1000)}:F>`, inline: false }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Keep working hard for more gold!', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [salaryEmbed] });
    }
};
