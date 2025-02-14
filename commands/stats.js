const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const Job = require("../models/Job");
const Trade = require("../models/Trade");  // Assuming you have a trade model
const { getUptime } = require("../utils/uptime");  // Assuming you have an uptime utility

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows server-wide statistics like user count, jobs, and total gold."),
  
  async execute(interaction) {
    // Fetch statistics
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalGold = await User.aggregate([{ $group: { _id: null, totalGold: { $sum: "$gold" } } }]);
    
    const goldInCirculation = totalGold.length > 0 ? totalGold[0].totalGold : 0;
    const avgGoldPerUser = totalUsers > 0 ? goldInCirculation / totalUsers : 0;

    // Find the richest user, excluding treasury
    const richestUser = await User.findOne({ _id: { $ne: "treasury" } }).sort({ gold: -1 });

    const richestUserName = richestUser ? richestUser.username : "N/A";
    const richestUserGold = richestUser ? richestUser.gold.toLocaleString() : "N/A";

    // Create the embed response
    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("📊 Server Statistics")
      .setDescription("Here are the current economy statistics for this server:")
      .addFields(
        { name: "Total Users in System", value: `${totalUsers}`, inline: true },
        { name: "Total Jobs Available", value: `${totalJobs}`, inline: true },
        { name: "Total Gold in Circulation", value: `${goldInCirculation.toLocaleString()}`, inline: false },
        { name: "Gold per User (Avg)", value: `${avgGoldPerUser.toLocaleString()}`, inline: true },
        { name: "Richest User", value: `${richestUserName} with ${richestUserGold} gold`, inline: false }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
