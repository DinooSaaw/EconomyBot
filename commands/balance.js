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
    .setDescription("Check a character's gold balance.")
    .addStringOption(option =>
      option.setName("character")
        .setDescription("The name of your character")
        .setRequired(true)
    ),
  async execute(interaction) {
    let settings = await GuildSettings.findOne({ _id: interaction.guild.id });
    if (!settings) {
      settings = await GuildSettings.create({
        _id: interaction.guild.id,
      });
    }

    const characterName = interaction.options.getString("character");
    
    // Retrieve character data
    let user = await User.findOne({ name: characterName });
    if (!user) {
      return interaction.reply({
        content: `❌ Character **${characterName}** not found.`,
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
        content: "❌ You can only check the balance's of character you own.",
        flags: MessageFlags.Ephemeral
      });
    }

    const balanceEmbed = new EmbedBuilder()
      .setColor("#FFD700") // Gold color
      .setTitle("💰 Balance Check")
      .setDescription(
        `**${user.name}** has **${user.gold.toLocaleString()}** gold.`
      )
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
