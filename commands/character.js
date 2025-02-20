const { SlashCommandBuilder } = require("discord.js");
const Character = require("../models/Character");
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
          option
            .setName("name")
            .setDescription("Character name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a character.")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Character name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all characters.")
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

    if (subcommand === "create") {
      if (settings.maxCharacters) {
        const characters = await Character.find({ "owner.id": owner.id });
        if (characters.length >= settings.maxCharacters) {
          return interaction.reply(
            `❌ You have reached the maximum number of characters allowed.`
          );
        }
      }

      const name = interaction.options.getString("name");
      await Character.create({
        name,
        owner: owner,
      });
      return interaction.reply(`✅ Character **${name}** created.`);
    }

    if (subcommand === "delete") {
      const name = interaction.options.getString("name");
      await Character.deleteOne({ name, "owner.id": owner.id });
      return interaction.reply(`✅ Character **${name}** deleted.`);
    }

    if (subcommand === "list") {
      const characters = await Character.find({ "owner.id": owner.id });
      const charList =
        characters.length > 0
          ? characters.map((c) => `${c.name}`).join("\n")
          : "None";
      return interaction.reply(`📜 **Character List:**\n${charList}`);
    }
  },
};
