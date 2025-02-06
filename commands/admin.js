const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const GuildSettings = require("../models/Settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription(
      "Admin commands for managing the systems within the economy system."
    )
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
              {
                name: "Show Users Balance to Everyone",
                value: "showUsersBalance",
              },
              { name: "Trade Notifications", value: "tradeNotifications" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Reset all settings to default.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("modify_permissions")
        .setDescription(
          "Modify role or user permissions for specific commands."
        )
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("Select the command to modify permissions for.")
            .setRequired(true)
            .addChoices(
              { name: "Fine", value: "fine" },
              { name: "Government", value: "government" },
              { name: "Admin", value: "admin" }
            )
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("Select a role to modify.")
            .setRequired(false)
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Select a user to modify.")
            .setRequired(false)
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
        ephemeral: true,
      });
    }

    if (subcommand === "show") {
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

      // Show command permissions
      const commandNames = ["fine", "government", "admin"];
      for (const command of commandNames) {
        const allowedRoles = settings[command]?.allowedRoles || [];
        const allowedUsers = settings[command]?.allowedUsers || [];

        const roleMentions =
          allowedRoles.map((id) => `<@&${id}>`).join(", ") || "None";
        const userMentions =
          allowedUsers.map((id) => `<@${id}>`).join(", ") || "None";

        embed.addFields({
          name: `🔹 ${
            command.charAt(0).toUpperCase() + command.slice(1)
          } Command Permissions`,
          value: `**Roles:** ${roleMentions}\n**Users:** ${userMentions}`,
          inline: false,
        });
      }

      embed.setFooter({
        text: "Use /settings modify_permissions to update roles/users.",
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
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
        ephemeral: true,
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
              .setDescription(
                "You must specify either a **Role** or a **User**."
              ),
          ],
          ephemeral: true,
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
                  `The ${role ? "role" : "user"} **${
                    role ? role.name : user.tag
                  }** is already assigned for \`${command}\`.`
                ),
            ],
            ephemeral: true,
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
                  `The ${role ? "role" : "user"} **${
                    role ? role.name : user.tag
                  }** is not assigned to \`${command}\`.`
                ),
            ],
            ephemeral: true,
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
        ephemeral: true,
      });
    }
  },
};
