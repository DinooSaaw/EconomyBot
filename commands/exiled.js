const { SlashCommandBuilder, EmbedBuilder, WebhookClient } = require("discord.js");
const User = require("../models/User");
const Shop = require("../models/Shop");
const allowedJobs = ["Dragons", "Royals"];

// Replace with your actual webhook URL
const webhookClient = new WebhookClient({ url: "https://discord.com/api/webhooks/1342366897290608680/MBFWlSdDCUTanHNV-2mitNNTGnTzn-CQ6gUq8m56O3Qu1-ZRMISOl2kJTbKrtjviQNDr" });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exiled")
    .setDescription("Exile a character, stripping them of all assets.")
    .addStringOption(option =>
      option.setName("target")
        .setDescription("The character to be exiled.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("The reason for exile.")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName("agree")
        .setDescription("This action is irrevocable.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getString("target");
    const reason = interaction.options.getString("reason");
    const agree = interaction.options.getBoolean("agree");

    if (!agree) {
      return interaction.reply({
        content: "❌ You must agree to the **irrevocable** nature of this action.\nRe-run the command with `agree: true`.",
        ephemeral: true
      });
    }


    const executor = await User.findOne({ owner, job: { $in: allowedJobs }});

    if (!executor) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000') // Red for error
                            .setTitle('❌ Access Denied')
                            .setDescription('You do not have a character with the permissions to fine users.')
                    ],
                    flags: MessageFlags.Ephemeral
                });
            }

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
    const shop = await Shop.findOne({ "owner.id": user._id, closed: { $ne: true } });
    if (shop) {
      shop.owner = null; // Remove ownership
      shop.closed = true; // Close shop
      await shop.save();
    }

    // **Embed for interaction response**
    const interactionEmbed = new EmbedBuilder()
      .setTitle("⚖️ Exile Decree Executed")
      .setColor(0xff0000)
      .setDescription(`**${target}** has been officially **exiled**.`)
      .addFields(
        { name: "Reason", value: reason },
        { name: "Gold Seized", value: `💰 ${user.gold} gold was seized` },
        { name: "Job Revoked", value: "🛑 Immediate Termination of Employment" },
        { name: "Shop Status", value: shop ? "🏚️ Closed & Ownership Revoked" : "❌ No Shop Owned" },
        { name: "Issued By", value: `🔹 ${executor.name}` }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [interactionEmbed] });

    // **Webhook Embed - Official Government Proclamation**
    const webhookEmbed = new EmbedBuilder()
      .setTitle("📜 Official Proclamation of Exile")
      .setColor(0xff0000)
      .setDescription(
        `**By decree of The High Council, let it be known throughout the land:**\n\n` +
        `The individual known as **${target}** has been **exiled** from our society, ` +
        `stripped of all possessions, and cast out as a consequence of their actions.\n\n` +
        `This decision is **final and irrevocable**. Let this serve as a warning to all who dare to defy our laws.`
      )
      .addFields(
        { name: "🔹 Subject of Exile", value: `**${target}**`, inline: true },
        { name: "📜 Grounds for Exile", value: `_${reason}_`, inline: true },
        { name: "💰 Assets Seized", value: `💰 ${user.gold} gold was seized` },
        { name: "⚒️ Employment Status", value: "🛑 Permanent Dissolution of Employment" },
        { name: "🏚️ Property Status", value: shop ? "✅ Shop Confiscated" : "❌ No Shop Owned" }
      )
      .setFooter({ text: "This decree is issued under the authority of The High Council. " })
      .setTimestamp();

    // **Send Webhook Official Announcement**
    await webhookClient.send({
      username: "The High Council",
      avatarURL: "https://example.com/exile-seal.png", // Change to an official-looking icon
      embeds: [webhookEmbed],
    });

    return;
  }
};
