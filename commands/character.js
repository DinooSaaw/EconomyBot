const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Character = require("../models/User");
const GuildSettings = require("../models/Settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("character")
    .setDescription("Manage characters in the economy system.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a new character.")
        .addStringOption((option) =>
          option.setName("name").setDescription("Character name").setRequired(true)
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("Optional user to bind the character to").setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a character.")
        .addStringOption((option) =>
          option.setName("name").setDescription("Character name").setRequired(true)
        )
        .addUserOption((option) =>
          option.setName("user").setDescription("Optional user to delete the character from").setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all characters.")
        .addUserOption((option) =>
          option.setName("user").setDescription("Optional user to view characters of").setRequired(false)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    let settings = await GuildSettings.findOne({ _id: guildId });

    if (!settings) {
      settings = new GuildSettings({ _id: guildId });
      await settings.save();
    }

    const owner = {
      id: interaction.user.id,
      username: interaction.user.username,
    };

    let targetUser = owner; // Default to the command user

    if (interaction.options.getUser("user")) {
      targetUser = {
        id: interaction.options.getUser("user").id,
        username: interaction.options.getUser("user").username,
      };
    }

    if (subcommand === "create") {
      if (settings.maxCharacters) {
        const characters = await Character.find({ "owner.id": targetUser.id });
        if (characters.length >= settings.maxCharacters) {
          return interaction.reply(
            `❌ This user has reached the maximum number of characters allowed.`
          );
        }
      }

      const name = interaction.options.getString("name");
      await Character.create({
        name,
        owner: targetUser,
      });
      return interaction.reply(`✅ Character **${name}** created for **${targetUser.username}**.`);
    }

    if (subcommand === "delete") {
      const name = interaction.options.getString("name");
      const result = await Character.deleteOne({ name, "owner.id": targetUser.id });

      if (result.deletedCount === 0) {
        return interaction.reply(`❌ No character found with the name **${name}** for user **${targetUser.username}**.`);
      }

      return interaction.reply(`✅ Character **${name}** deleted for **${targetUser.username}**.`);
    }

    if (subcommand === "list") {
      const characters = await Character.find({ "owner.id": targetUser.id });

      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle(`Character List for ${targetUser.username}`)
        .setDescription("Here is the list of characters you have created:")
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

      if (characters.length > 0) {
        embed.addFields({
          name: "Characters:",
          value: characters.map((c) => `**${c.name}**`).join("\n"),
          inline: false,
        });
      } else {
        embed.addFields({
          name: "Characters:",
          value: "No characters created yet.",
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    }
  },
};
