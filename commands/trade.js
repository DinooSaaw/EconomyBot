const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const User = require("../models/User");
const GuildSettings = require("../models/Settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Trade gold with another character.")
    .addStringOption((option) =>
      option
        .setName("sender")
        .setDescription("Your character name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("Character name to trade with")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of gold to trade")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const senderCharacterName = interaction.options.getString("sender");
    const targetCharacterName = interaction.options.getString("target");
    const amount = Math.floor(interaction.options.getInteger("amount"));

    let senderUser = await User.findOne({ name: senderCharacterName });
    let receiverUser = await User.findOne({ name: targetCharacterName });

    // Fetch guild settings
    let settings = await GuildSettings.findOne({ _id: interaction.guild.id });
    if (!settings) {
      settings = await GuildSettings.create({
        _id: interaction.guild.id,
      });
    }

    const owner = {
      id: interaction.user.id,
      username: interaction.user.username,
    };

    // Create an embed message function
    const createEmbed = (title, description, color = "#00FF00") => {
      return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
          text: "All trades should be fair and mutually agreed upon.",
          iconURL: interaction.client.user.displayAvatarURL(),
        });
    };

    // Check if the sender exists in the database
    if (!senderUser) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "❌ Sender Not Found",
            `The sender character (**${senderCharacterName}**) does not exist in the economy system!`,
            "#FF0000"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if the receiver exists in the database
    if (!receiverUser) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "❌ Receiver Not Found",
            `The target character (**${targetCharacterName}**) does not exist in the economy system!`,
            "#FF0000"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if the user is the owner of the character
    if (senderUser.owner.id !== owner.id) {
      return interaction.reply({
        content: "❌ You can only trade using a character you own.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if the sender has enough gold
    if (senderUser.gold < amount) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "❌ Insufficient Gold",
            `The sender character (**${senderCharacterName}**) does not have enough gold to trade. They currently have **${senderUser.gold}** gold.`,
            "#FF0000"
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Perform the trade
    senderUser.gold -= amount;
    receiverUser.gold += amount;

    // Save both users after the trade
    await senderUser.save();
    await receiverUser.save();

    // Respond with an embed message about the trade
    if (settings.showTradeConfirmation) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "✅ Trade Successful",
            `${senderCharacterName} has successfully traded **${amount.toLocaleString()}** gold with **${targetCharacterName}**.\n\n**${senderCharacterName}'s** new balance: **${senderUser.gold.toLocaleString()}** gold.\n**${targetCharacterName}'s** new balance: **${receiverUser.gold.toLocaleString()}** gold.`
          ),
        ],
      });
    } else {
      return interaction.reply({
        embeds: [
          createEmbed(
            "✅ Trade Successful",
            `You have successfully traded **${amount.toLocaleString()}** gold with **${targetCharacterName}**.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
