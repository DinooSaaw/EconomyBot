const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const GuildSettings = require("../models/Settings");

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
              { name: "Show Treasury Balance to Everyone", value: "showTreasuryBalance" },
              { name: "Show Users Balance to Everyone", value: "showUsersBalance" },
              { name: "Trade Notifications", value: "tradeNotifications" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("reset").setDescription("Reset all settings to default.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("modify_permissions")
        .setDescription("Modify role or user permissions for specific commands.")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("Select the command to modify permissions for.")
            .setRequired(true)
            .addChoices(
              { name: "Government", value: "government" },
              { name: "Admin", value: "admin" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Choose to add or remove the role/user.")
            .setRequired(true)
            .addChoices(
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" }
            )
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("Select a role to modify.").setRequired(false)
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("Select a user to modify.").setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("maxcharacters")
        .setDescription("Set or view the maximum character limit for messages.")
        .addIntegerOption((option) =>
          option
            .setName("limit")
            .setDescription("Set the maximum character limit.")
            .setRequired(false)
            .setMinValue(1)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    let settings = await GuildSettings.findOne({ _id: guildId });

    if (!settings) {
      settings = new GuildSettings({ _id: guildId });
      await settings.save();
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "reset") {
      await settings.deleteOne({ _id: guildId });
      await new GuildSettings({ _id: guildId });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🔄 Settings Reset")
            .setDescription("All settings have been reset to default values."),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "show") {
      const embed = new EmbedBuilder()
        .setColor("#00AAFF")
        .setTitle("⚙️ Guild Settings")
        .setFooter({ text: "Use /settings toggle to update most settings." })
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
            name: "Show Users Balance to Everyone",
            value: settings.showUsersBalance ? "✅ Enabled" : "❌ Disabled",
            inline: false,
          },
          {
            name: "Trade Notifications",
            value: settings.tradeNotifications ? "✅ Enabled" : "❌ Disabled",
            inline: false,
          }
        );

      // Add maxCharacters to the settings display
      embed.addFields({
        name: "Max Characters per Users",
        value: settings.maxCharacters
          ? `🔢 **${settings.maxCharacters}** characters per User`
          : "❌ Not Set",
        inline: false,
      });

      // Command permissions section
      const embed2 = new EmbedBuilder()
        .setColor("#00AAFF")
        .setTitle("⚙️ Command Permissions")
        .setFooter({ text: "Use /settings modify_permissions to update roles/users permissions." });

      const commandNames = ["government", "admin"];
      for (const command of commandNames) {
        const allowedRoles = settings[command]?.allowedRoles || [];
        const allowedUsers = settings[command]?.allowedUsers || [];

        const roleMentions = allowedRoles.map((id) => `<@&${id}>`).join(", ") || "None";
        const userMentions = allowedUsers.map((id) => `<@${id}>`).join(", ") || "None";

        embed2.addFields({
          name: `🔹 ${command.charAt(0).toUpperCase() + command.slice(1)} Command Permissions`,
          value: `**Roles:** ${roleMentions}\n**Users:** ${userMentions}`,
          inline: true,
        });
      }

      return interaction.reply({ embeds: [embed, embed2], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "toggle") {
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
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "modify_permissions") {
      const command = interaction.options.getString("command");
      const role = interaction.options.getRole("role");
      const user = interaction.options.getUser("user");
      const action = interaction.options.getString("action");

      if (!role && !user) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setTitle("❌ Invalid Input")
              .setDescription("You must specify either a **Role** or a **User**."),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const field = role ? "allowedRoles" : "allowedUsers";
      const id = role ? role.id : user.id;
      const list = settings[command][field];

      if (action === "add") {
        if (!list.includes(id)) {
          list.push(id);
        } else {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFA500")
                .setTitle("⚠️ Already Exists")
                .setDescription(
                  `The ${role ? "role" : "user"} **${role ? role.name : user.tag}** is already assigned for \`${command}\`.`
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      } else {
        const index = list.indexOf(id);
        if (index !== -1) {
          list.splice(index, 1);
        } else {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("❌ Not Found")
                .setDescription(
                  `The ${role ? "role" : "user"} **${role ? role.name : user.tag}** is not assigned to \`${command}\`.`
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      await settings.save();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("✅ Permissions Updated")
            .setDescription(
              `Successfully ${action === "add" ? "added" : "removed"} **${
                role ? role.name : user.tag
              }** to **${command}** permissions.`
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (subcommand === "maxcharacters") {
      const limit = interaction.options.getInteger("limit");

      if (limit) {
        settings.maxCharacters = limit;
        await settings.save();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("✅ Max Characters Updated")
              .setDescription(`The maximum character limit has been set to **${limit}** characters.`),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#00AAFF")
              .setTitle("ℹ️ Current Max Characters Setting")
              .setDescription(
                `The current max characters setting is **${settings.maxCharacters || "not set"}**.`
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
