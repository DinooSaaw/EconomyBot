const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const User = require("../Models/User.js");
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
    let user = await User.findOne({ _id: interaction.user.id });
    if (!user)
      user = await User.create({
        _id: interaction.user.id,
        name: interaction.user.username,
      });

    const balanceEmbed = new EmbedBuilder()
      .setColor("#FFD700") // Gold color
      .setTitle("💰 Balance Check")
      .setDescription(
        `**${
          interaction.user.displayName
        }**, you have **${user.gold.toLocaleString()}** gold.`
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: "Use /salary to collect your salary!",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    if(settings.showUsersBalance){
        await interaction.reply({ embeds: [balanceEmbed] });
    } else {
        await interaction.reply({ embeds: [balanceEmbed], flags: MessageFlags.Ephemeral });
    }
  },
};
