const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const Shop = require("../models/Shop");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exiled")
    .setDescription("Exile a user, stripping them of all assets and preventing participation in the economy.")
    .addStringOption(option => 
      option.setName("target")
        .setDescription("The user to be exiled.")
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName("reason")
        .setDescription("The reason for exile.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getString("target");
    const reason = interaction.options.getString("reason");
    const executor = await User.findOne({ owner, job: "Guards" });
    const user = await User.findOne({ name: target });
    if (!user) {
      return interaction.reply(`❌ User **${target}** not found.`);
    }

    if (user.isExiled) {
      return interaction.reply(`⚠️ **${target}** is already exiled.`);
    }

    // Add criminal record
    user.criminalRecord.push({
      punishmentType: "Exiled",
      amount: user.gold, // No direct fine, just asset removal
      reason,
      issuedBy: executor.name,
      issuedAt: new Date(),
    });


    // Remove assets
    let treasury = await User.findOne({ name: "Treasury" });
    treasury.gold += user.gold;
    user.gold = 0;
    user.job = null;
    user.isExiled = true;


    await user.save();

    // Remove shop ownership if applicable
    const shop = await Shop.findOne({ "owner.id": user._id });
    if (shop) {
      shop.owner = null; // Remove ownership
      await shop.save();
    }

    // Send confirmation embed
    const embed = new EmbedBuilder()
      .setTitle("🚨 User Exiled 🚨")
      .setColor("DARK_RED")
      .setDescription(`**${target}** has been exiled!`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Gold Removed", value: "✅ Yes" },
        { name: "Job Removed", value: "✅ Yes" },
        { name: "Shop Ownership Removed", value: shop ? "✅ Yes" : "❌ No Shop Owned" }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
