const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const User = require("../models/User"); // Your existing User model
const Job = require("../models/Job"); // Job model to fetch user jobs if needed
const GuildSettings = require("../models/Settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("government")
    .setDescription("View and manage government-related data.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("treasury")
        .setDescription("Shows the current royal treasury balance.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view_user")
        .setDescription("View a character’s information.")
        .addStringOption((option) =>
          option
            .setName("target")
            .setDescription("The name of character to view")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const settings = await GuildSettings.findById(guildId) || new GuildSettings({ _id: guildId });

    const member = interaction.member;
    const hasRequiredRole = member && member.roles.cache.some(role => settings.government.allowedRoles.includes(role.id));
    const isAuthorizedUser = settings.government.allowedUsers.includes(interaction.user.id);

    if (!hasRequiredRole && !isAuthorizedUser) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("❌ Unauthorized")
            .setDescription(
              "You do not have the required role or permission to access this command."
            )
            .setFooter({
              text: interaction.client.user.tag,
              iconURL: interaction.client.user.displayAvatarURL(),
            }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    // Embed response function
    const createEmbed = (
      title,
      description,
      color = "#00FF00",
      footer = interaction.client.user.tag
    ) => {
      return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
          text: "The treasury funds must be managed responsibly",
          iconURL: interaction.client.user.displayAvatarURL(),
        });
    };

    if (subcommand === "treasury") {
      // Fetch the "treasury" user document
      const treasury = await User.findOne({ name: "Treasury" });

      if (!treasury) {
        return interaction.reply({
          embeds: [
            createEmbed(
              "❌ Treasury Not Found",
              "The treasury user document does not exist in the database.",
              "#FF0000"
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!settings.showTreasuryBalance) {
        return interaction.reply({
          embeds: [
            createEmbed(
              "🏛️ Royal Treasury",
              `The current royal treasury balance is **${treasury.gold.toLocaleString()}** gold.`
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        return interaction.reply({
          embeds: [
            createEmbed(
              "🏛️ Royal Treasury",
              `The current royal treasury balance is **${treasury.gold.toLocaleString()}** gold.`
            ),
          ],
        });
      }
    }

    if (subcommand === "view_user") {
      const targetName = interaction.options.getString("target");
      let user = await User.findOne({ name: targetName });

      if (!user) {
        return interaction.reply({
          content: `User **${targetName}** not found in the system.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const job = user.job ? await Job.findOne({ name: user.job }) : null;
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      // Calculate the next salary time
      const lastSalaryTimestamp = user.lastSalary
        ? new Date(user.lastSalary).getTime()
        : 0;
      let canClaimSalary =
        user.lastSalary && now - lastSalaryTimestamp >= oneWeek;
      if (canClaimSalary == null) {
        canClaimSalary = true;
      }
      const nextSalaryDate = canClaimSalary
        ? "Can claim salary!"
        : `<t:${Math.floor((lastSalaryTimestamp + oneWeek) / 1000)}:F>`;

      // Format criminal record
      const criminalRecord = user.criminalRecord;
      let guildUser = interaction.guild.members.cache.find(
        (member) => member.id === user.owner.id
      );
      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle(`📋 User Data for ${targetName}`)
        .setThumbnail(guildUser.displayAvatarURL({ dynamic: true } || null ))
        .addFields(
          {
            name: "Job",
            value: user.job ? user.job : "No job assigned",
            inline: false,
          },
          {
            name: "Gold Balance",
            value: `${user.gold.toLocaleString()}`,
            inline: false,
          },
          {
            name: "Last Salary",
            value: user.lastSalary
              ? `<t:${Math.floor(user.lastSalary / 1000)}:F>`
              : "Never received salary",
            inline: true,
          },
          { name: "Next Salary Available", value: nextSalaryDate, inline: true }
        );

      const embed2 = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle(`📋 Criminal Record for ${targetName}`)
        .setThumbnail(guildUser.displayAvatarURL({ dynamic: true } || null ))

      if (criminalRecord.length === 0) {
        embed2.setDescription("No criminal record.");
      } else {
        criminalRecord.forEach((crime) => {
          embed2.addFields({
            name: `Punishment: ${crime.punishmentType}`,
            value: `**Reason:** ${crime.reason}\n**Issued By:** ${crime.issuedBy}\n**Issued At:** <t:${Math.floor(crime.issuedAt / 1000)}:F>`,
            inline: false,
          });
        });
      }

      let embeds = [embed];
      if(settings.showCriminalRecord) {
        embeds.push(embed2);
      }
      return interaction.reply({
        embeds: embeds,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
