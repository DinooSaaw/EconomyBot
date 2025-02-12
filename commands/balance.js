const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const User = require("../models/User.js");
const Job = require("../models/Job.js"); // Import Job model
const GuildSettings = require("../models/Settings.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your gold balance."),
  async execute(interaction) {
    let settings = await GuildSettings.findOne({ _id: interaction.guild.id });
    if (!settings) {
      settings = await GuildSettings.create({
        _id: interaction.guild.id,
      });
    }

    // Retrieve user data
    let user = await User.findOne({ _id: interaction.user.id });
    if (!user) {
      var job = await Job.findOne({ roleId: { $in: interaction.member.roles.cache.map(role => role.id) } });
      user = await User.create({
        _id: interaction.user.id,
        name: interaction.user.username,
        job: job ? job.name : null,
      });
    }

    // Check if the user has a job and if the job's role matches

    const balanceEmbed = new EmbedBuilder()
      .setColor("#FFD700") // Gold color
      .setTitle("💰 Balance Check")
      .setDescription(
        `**${interaction.user.displayName}**, you have **${user.gold.toLocaleString()}** gold.`
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: "Use /salary to collect your salary!",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    // Check the setting for showing user balance
    if (settings.showUsersBalance) {
      await interaction.reply({ embeds: [balanceEmbed] });
    } else {
      await interaction.reply({ embeds: [balanceEmbed], flags: MessageFlags.Ephemeral });
    }
  },
};
