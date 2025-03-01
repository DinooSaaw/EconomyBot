const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const Job = require("../models/Job");
const Shop = require("../models/Shop");
const GuildSettings = require("../models/Settings");

// Helper function to check if a number is a whole number
function isWholeNumber(value) {
  return Number.isInteger(value) && value > 0;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription(
      "Admin commands for managing the systems within the economy system."
    )

    // Job Management Subcommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("job")
        .setDescription("Manage jobs in the economy system.")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("What do you want to do?")
            .setRequired(true)
            .addChoices(
              { name: "Create", value: "create" },
              { name: "Remove", value: "remove" },
              { name: "Update", value: "update" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Job name (required for create, update, remove)")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("basepay")
            .setDescription("Base salary for this job (only for create/update)")
        )
        .addIntegerOption((option) =>
          option
            .setName("tax")
            .setDescription("Tax amount for this job (only for create/update)")
        )
    )

    // User Management Subcommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Manage users in the economy system.")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("What do you want to do?")
            .setRequired(true)
            .addChoices(
              { name: "Set Job", value: "set_job" },
              { name: "Modify Gold", value: "modify_gold" },
              { name: "Delete User", value: "delete" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("target")
            .setDescription("Character to modify.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("job")
            .setDescription("New job name (only for set_job)")
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription(
              "Modify the gold balance (does not set, only modifies; applies only to modify_gold)."
            )
        )
    )

    // Shop Management Subcommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("shop")
        .setDescription("Manage shops in the economy system.")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("What do you want to do?")
            .setRequired(true)
            .addChoices(
              { name: "Create", value: "create" },
              { name: "Remove", value: "remove" }
            )
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("Shop name").setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("maxemployees")
            .setDescription(
              "Max number of employees for this shop (only for create)"
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("weeklypay")
            .setDescription("Weekly pay for employees (only for create)")
        )
        .addStringOption((option) =>
          option.setName("owner").setDescription("The owner of the shop")
        )
    )

    // Transfer Shop Ownership Subcommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("transfer_owner")
        .setDescription("Transfer ownership of a shop to another user.")
        .addStringOption((option) =>
          option
            .setName("shop_name")
            .setDescription("The name of the shop to transfer ownership")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("new_owner")
            .setDescription("The new owner of the shop")
            .setRequired(true)
        )
    )

    // Show Subcommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show all jobs and shops in the economy system.")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const action = interaction.options.getString("action");

    // Job Management
    if (subcommand === "job") {
      const name = interaction.options.getString("name");
      const basePay = interaction.options.getInteger("basepay");
      const tax = interaction.options.getInteger("tax");

      if (basePay !== null && !isWholeNumber(basePay)) {
        return interaction.reply(
          `❌ The base pay must be a positive whole number.`
        );
      }

      if (tax !== null && !isWholeNumber(tax)) {
        return interaction.reply(
          `❌ The tax amount must be a positive whole number.`
        );
      }

      if (action === "create") {
        await Job.create({
          name,
          basePay,
          tax: tax || 0,
        });
        return interaction.reply(
          `✅ Job **${name}** created with **${basePay}** base pay and **${
            tax || 0
          }** tax.`
        );
      }

      if (action === "update") {
        const job = await Job.findOne({ name });
        if (!job) return interaction.reply(`❌ Job **${name}** not found.`);

        if (basePay !== null) job.basePay = basePay;
        if (tax !== null) job.tax = tax;
        await job.save();

        return interaction.reply(
          `✅ Job **${name}** updated with new base pay: **${basePay}** and tax: **${
            tax || 0
          }**.`
        );
      }

      if (action === "remove") {
        const job = await Job.findOne({ name });
        if (!job) return interaction.reply(`❌ Job **${name}** not found.`);

        // Find all users with the role assigned to this job and remove their job
        const usersWithRole = await User.find({ job: job.name });
        if (usersWithRole.length > 0) {
          // Remove job from all users who have it
          for (const user of usersWithRole) {
            user.job = null;
            await user.save();
          }
          return interaction.reply(
            `✅ Job **${name}** removed. All users with this job have had their job removed.`
          );
        }

        // Proceed to delete the job after removing from users
        await job.deleteOne({ name });
        return interaction.reply(`✅ Job **${name}** removed.`);
      }
    }

    // User Management
    if (subcommand === "user") {
      const target = interaction.options.getString("target");
      const action = interaction.options.getString("action");

      if (action === "set_job") {
        const jobName = interaction.options.getString("job");
        const user = await User.findOne({ name: target });
        if (!user) {
          var userData = await interaction.guild.members.fetch(target);
          let Userjob = await Job.findOne({
            roleId: {
              $in: interaction.member.roles.cache.map((role) => role.id),
            },
          });
          NewUser = await User.create({
            _id: userData.user.id,
            name: userData.user.username,
            job: Userjob ? Userjob.name : "",
          });
        }

        const job = await Job.findOne({ name: jobName });
        if (!job) return interaction.reply(`❌ Job **${jobName}** not found.`);

        user.job = job.name;
        await user.save();
        return interaction.reply(
          `✅ Job for **${target}** updated to **${jobName}**.`
        );
      }

      if (action === "modify_gold") {
        const amount = interaction.options.getInteger("amount");
        const user = await User.findOne({ name: target });
        if (!user) {
          var userData = await interaction.guild.members.fetch(target);
          let Userjob = await Job.findOne({
            roleId: {
              $in: interaction.member.roles.cache.map((role) => role.id),
            },
          });
          NewUser = await User.create({
            _id: userData.user.id,
            name: userData.user.username,
            job: Userjob ? Userjob.name : "",
          });
        }

        if (amount !== null && !Number.isInteger(amount)) {
          return interaction.reply(
            `❌ The gold balance must be an integer value (it can be negative).`
          );
        }

        user.gold += amount;
        await user.save();
        return interaction.reply(
          `✅ Gold for **${target}** updated. New balance: **${user.gold}**.`
        );
      }

      if (action === "delete") {
        const user = await User.findOne({ _id: target });
        if (!user) return interaction.reply(`❌ User **${target}** not found.`);
        await user.deleteOne({ _id: target });
        return interaction.reply(`✅ User **${target}** deleted.`);
      }
    }

    // Shop Management
    if (subcommand === "shop") {
      const name = interaction.options.getString("name");
      const owner = interaction.options.getString("owner"); // Get owner

      if (action === "create") {
        const maxEmployees = interaction.options.getInteger("maxemployees");
        const weeklyPay = interaction.options.getInteger("weeklypay");

        // Validate maxEmployees only if it's not null
        if (maxEmployees !== null && !isWholeNumber(maxEmployees)) {
          return interaction.reply(
            `❌ The max number of employees must be a positive whole number.`
          );
        }

        // Validate weeklyPay if it's not null
        if (weeklyPay == null && !isWholeNumber(weeklyPay)) {
          return interaction.reply(
            `❌ The weekly pay must be a positive whole number.`
          );
        }

        // Create the shop with the owner and other fields
        await Shop.create({
          name,
          maxEmployees: maxEmployees || null, // Allow maxEmployees to be null
          salary: weeklyPay,
          owner,
        });
        return interaction.reply(
          `✅ Shop **${name}** created with **${
            maxEmployees !== null ? maxEmployees : "no limit"
          }** max employees and **${weeklyPay}** weekly pay. Owner: **${owner}**.`
        );
      }

      if (action === "remove") {
        const shop = await Shop.findOne({ name });
        if (!shop) return interaction.reply(`❌ Shop **${name}** not found.`);

        await shop.deleteOne({ name });
        return interaction.reply(`✅ Shop **${name}** removed.`);
      }
    }

    // Transfer Shop Ownership
    if (subcommand === "transfer_owner") {
      const shopName = interaction.options.getString("shop_name");
      const newOwner = interaction.options.getString("new_owner");

      const shop = await Shop.findOne({ name: shopName });
      if (!shop) return interaction.reply(`❌ Shop **${shopName}** not found.`);

      if (shop.owner === newOwner) {
        return interaction.reply(
          `❌ The new owner is already the owner of this shop.`
        );
      }

      shop.owner = newOwner;
      await shop.save();

      return interaction.reply(
        `✅ Shop **${shopName}** ownership transferred to **${newOwner}**.`
      );
    }

    if (subcommand === "show") {
      const jobs = await Job.find();
      const shops = await Shop.find();

      // Format job information
      const jobFields = jobs.map(
        (job) => `**${job.name}** - Base Pay: ${job.basePay}, Tax: ${job.tax}`
      );

      // Format shop information
      const shopFields = shops.map(
        (shop) =>
          `**${shop.name}** - Owner: ${shop.owner} \nMax Employees: ${shop.maxEmployees || "Unlimited"}, Weekly Pay: ${
            shop.salary
          }`
      );

      // Create the embed
      const embed = new EmbedBuilder()
        .setTitle("Economy System Overview")
        .setColor(0x00ff00)
        .setDescription("Here are all the jobs and shops in the system.")
        .addFields(
          {
            name: "Jobs",
            value: jobFields.length
              ? jobFields.join("\n")
              : "No jobs available.",
            inline: false,
          },
          {
            name: "Shops",
            value: shopFields.length
              ? shopFields.join("\n")
              : "No shops available.",
            inline: false,
          }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
