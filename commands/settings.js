const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const GuildSettings = require("../models/Settings"); // Your MongoDB model for storing guild settings

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Manage guild-wide settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("View current guild settings.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toggle")
        .setDescription("Toggle a specific setting.")
        .addStringOption((option) =>
          option
            .setName("option")
            .setDescription("The setting to toggle")
            .setRequired(true)
            .addChoices(
              { name: "Show Criminal Record", value: "showCriminalRecord" },
              {
                name: "Show Treasury Balance to Everyone",
                value: "showTreasuryBalance",
              },
              { name: "Trade Notifications", value: "tradeNotifications" }
            )
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    // Fetch or create default settings for the guild
    let settings = await GuildSettings.findOne({ _id: guildId });
    if (!settings) {
      settings = await GuildSettings.create({
        _id: guildId,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "show") {
      // Display current settings
      const embed = new EmbedBuilder()
        .setColor("#00AAFF")
        .setTitle("⚙️ Guild Settings")
        .addFields(
          {
            name: "Show Criminal Record",
            value: settings.showCriminalRecord ? "✅ Enabled" : "❌ Disabled",
            inline: false,
          },
          {
            name: "Show Treasury Balance to Everyone",
            value: settings.showTreasuryBalance ? "✅ Enabled" : "❌ Disabled",
            inline: false,
          },
          {
            name: "Trade Notifications",
            value: settings.tradeNotifications ? "✅ Enabled" : "❌ Disabled",
            inline: false,
          }
        )
        .setFooter({
          text: "Use /settings toggle [option] to change settings.",
        });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === "toggle") {
      // Toggle the selected setting
      const option = interaction.options.getString("option");
      settings[option] = !settings[option];
      await settings.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("✅ Setting Updated")
            .setDescription(
              `**${option.replace(/([A-Z])/g, " $1").trim()}** is now ${
                settings[option] ? "✅ Enabled" : "❌ Disabled"
              }.`
            ),
        ],
        ephemeral: true,
      });
    }
  },
};
