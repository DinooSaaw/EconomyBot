const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../Models/User");
const GuildSettings = require("../models/Settings");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Trade gold with another user.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("User to trade with")
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
    const targetUser = interaction.options.getUser("target");
    const amount = interaction.options.getInteger("amount");
    const senderUser = await User.findOne({ _id: interaction.user.id });
    let receiverUser = await User.findOne({ _id: targetUser.id });

    // Fetch guild settings
    let settings = await GuildSettings.findOne({ _id: interaction.guild.id });
    if (!settings) {
      settings = await GuildSettings.create({
        _id: interaction.guild.id,
      });
    }
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
            "You do not have a profile in the economy system!",
            "#FF0000"
          ),
        ],
        ephemeral: true,
      });
    }

    // Check if the receiver exists in the database
    if (!receiverUser) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "❌ Receiver Not Found",
            "The target user does not have a profile in the economy system!",
            "#FF0000"
          ),
        ],
        ephemeral: true,
      });
    }

    // Check if the sender has enough gold
    if (senderUser.gold < amount) {
      return interaction.reply({
        embeds: [
          createEmbed(
            "❌ Insufficient Gold",
            `You do not have enough gold to trade. You currently have **${senderUser.gold}** gold.`,
            "#FF0000"
          ),
        ],
        ephemeral: true,
      });
    }

    // Check if the receiver has enough gold to receive the trade (optional logic, adjust as needed)
    // Here, we assume the receiver has no constraints, but you can add checks based on the receiver's balance if desired.

    // Perform the trade
    senderUser.gold -= amount;
    receiverUser.gold += amount;

    // Save both users after the trade
    await senderUser.save();
    await receiverUser.save();

    // Respond with an embed message about the trade

    if (settings.showTradeConfirmation) {
        return interaction.reply({
            embeds: [ createEmbed(
                "✅ Trade Successful",
                `${
                    interaction.user.displayName
                } has successfully traded **${amount.toLocaleString()}** gold with **${targetUser.displayName}**.\n\nYour new balance: **${senderUser.gold.toLocaleString()}** gold.\n${targetUser.displayName}'s new balance: **${receiverUser.gold.toLocaleString()}** gold.`),
            ],
        });
        } else {
        return interaction.reply({
            embeds: [ createEmbed(
                "✅ Trade Successful",
                `You have successfully traded **${amount.toLocaleString()}** gold with **${targetUser.displayName}**.`),
            ],
            ephemeral: true,
        });
        }
    },
}