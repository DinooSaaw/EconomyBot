const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Shop = require("../models/Shop");
const User = require("../models/User"); // Assuming User model is available
const GuildSettings = require("../models/GuildSettings"); // Assuming GuildSettings model is available

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Manage and interact with shops.")
    .addSubcommand((sub) =>
      sub.setName("info").setDescription("View shop details.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("claim_salary")
        .setDescription("Claim shop salary as the owner.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set_owner")
        .setDescription("Set the owner of a shop.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName("owner").setDescription("The new owner").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add_staff")
        .setDescription("Add a staff member to the shop.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
        .addUserOption((opt) =>
          opt
            .setName("staff")
            .setDescription("The staff member")
            .setRequired(true)
        )
        .addNumberOption((opt) =>
          opt.setName("salary").setDescription("Their salary").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove_staff")
        .setDescription("Remove a staff member from the shop.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
        .addUserOption((opt) =>
          opt
            .setName("staff")
            .setDescription("The staff member")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("post_item")
        .setDescription("Post an item for sale.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt.setName("price").setDescription("Item price").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt.setName("quantity")
          .setDescription("Item quantity")
          .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("buy_item")
        .setDescription("Buy an item from the shop.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt.setName("quantity").setDescription("Quantity to buy").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("request_salary")
        .setDescription("Request salary from the shop (staff only).")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("change_name")
        .setDescription("Change the shop's name.")
        .addStringOption((opt) =>
          opt.setName("shop_name").setDescription("The shop's current name").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("new_name").setDescription("The new shop name").setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const shopName = interaction.options.getString("shop_name");
    const userId = interaction.user.id;
    const shop = await Shop.findOne({ name: shopName });

    if (!shop && subcommand !== "info") {
      return interaction.reply({
        content: "Shop not found.",
        ephemeral: true,
      });
    }

    const isOwner = shop && shop.owner.id === userId;

    if (subcommand === "info") {
      if (!shopName) {
        // Display a list of all shops
        const allShops = await Shop.find({});
        if (allShops.length === 0) {
          return interaction.reply({
            content: "No shops available.",
            ephemeral: true,
          });
        }

        const shopList = allShops.map(
          (shop) => `${shop.name} - Owned by <@${shop.owner.id}>`
        ).join("\n");

        const embed = new EmbedBuilder()
          .setTitle("All Shops")
          .setDescription(shopList);

        return interaction.reply({ embeds: [embed] });
      }

      if (!shop)
        return interaction.reply({
          content: "No shop found.",
          ephemeral: true,
        });

      const userIsStaffOrOwner =
        shop.owner.id === interaction.user.id ||
        shop.staff.some((staff) => staff.userId === interaction.user.id);

      const staffList =
        shop.staff.map((s) => `<@${s.userId}>: ${s.salary}g`).join("\n") || "None";
      const inventoryList =
        shop.inventory
          .map(
            (item) =>
              `${item.itemName} - ${item.price}g (${item.quantity} left)`
          )
          .join("\n") || "No items listed.";

      const embedFields = [
        {
          name: "Owner",
          value: `<@${shop.owner.id}> (${shop.owner.username})`,
          inline: true,
        },
        { name: "Wallet", value: `${shop.wallet}g`, inline: true },
        { name: "Salary", value: `${shop.salary}g`, inline: true },
        { name: "Staff", value: staffList, inline: false },
      ];

      // If the user is not a staff member or the owner, only show the inventory
      if (!userIsStaffOrOwner) {
        embedFields.length = 0; // Clear all fields except inventory
      }

      embedFields.push({
        name: "Inventory",
        value: inventoryList,
        inline: false,
      });

      const embed = new EmbedBuilder().setTitle(`${shop.name}`).addFields(embedFields);

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "claim_salary") {
      if (shop.owner.id !== interaction.user.id) {
        return interaction.reply({
          content: "You must be the shop owner to claim the salary.",
          ephemeral: true,
        });
      }

      shop.wallet += shop.salary;
      await shop.save();
      return interaction.reply({
        content: `Claimed ${shop.salary}g!`,
        ephemeral: true,
      });
    }

    if (subcommand === "set_owner") {
      if (!isOwner) {
        return interaction.reply({
          content: "❌ You are not the owner of this shop.",
          ephemeral: true,
        });
      }

      const newOwner = interaction.options.getUser("owner");

      shop.owner = { id: newOwner.id, username: newOwner.username };
      await shop.save();

      return interaction.reply({
        content: `✅ Ownership of **${shop.name}** has been transferred to **${newOwner.username}**.`,
      });
    }

    if (subcommand === "add_staff") {
      if (!isOwner) {
        return interaction.reply({
          content: "❌ You must be the owner to add staff.",
          ephemeral: true,
        });
      }

      const staff = interaction.options.getUser("staff");
      const salary = interaction.options.getNumber("salary");
      shop.staff.push({ userId: staff.id, salary });
      await shop.save();
      return interaction.reply({
        content: `Added ${staff.username} as staff with salary ${salary}g.`,
      });
    }

    if (subcommand === "remove_staff") {
      if (!isOwner) {
        return interaction.reply({
          content: "❌ You must be the owner to remove staff.",
          ephemeral: true,
        });
      }

      const staff = interaction.options.getUser("staff");
      const staffIndex = shop.staff.findIndex(
        (s) => s.userId === staff.id
      );

      if (staffIndex === -1) {
        return interaction.reply({
          content: "This user is not a staff member of the shop.",
          ephemeral: true,
        });
      }

      shop.staff.splice(staffIndex, 1);
      await shop.save();

      return interaction.reply({
        content: `Removed ${staff.username} from staff.`,
      });
    }

    if (subcommand === "post_item") {
      const itemName = interaction.options.getString("item");
      const price = interaction.options.getNumber("price");
      const quantity = interaction.options.getNumber("quantity");

      shop.inventory.push({ itemName, price, quantity });
      await shop.save();
      return interaction.reply({
        content: `Added ${quantity}x ${itemName} for ${price}g each.`,
      });
    }

    if (subcommand === "buy_item") {
      const itemName = interaction.options.getString("item");
      const quantity = interaction.options.getNumber("quantity");
      const itemIndex = shop.inventory.findIndex(
        (i) => i.itemName === itemName
      );

      if (itemIndex === -1 || shop.inventory[itemIndex].quantity < quantity) {
        return interaction.reply({
          content: "Not enough stock.",
          ephemeral: true,
        });
      }

      const item = shop.inventory[itemIndex];
      const totalCost = item.price * quantity;
      const tax = 0; // Flat tax
      const netEarnings = totalCost - tax;

      // Fetch buyer's user data
      const buyer = await User.findOne({ _id: interaction.user.id });
      if (!buyer || buyer.gold < totalCost) {
        return interaction.reply({
          content: "You don't have enough gold.",
          ephemeral: true,
        });
      }

      // Deduct gold from buyer
      buyer.gold -= totalCost;
      await buyer.save();

      // Add earnings to shop wallet
      shop.wallet += netEarnings;

      // Deduct tax and add it to the treasury
      const treasury = await User.findOne({
        _id: "treasury",
      });
      treasury.gold += tax;
      await treasury.save();

      // Reduce item quantity or remove from inventory
      item.quantity -= quantity;
      if (item.quantity === 0) {
        shop.inventory.splice(itemIndex, 1);
      }

      await shop.save();

      return interaction.reply({
        content: `Bought ${quantity}x ${itemName} for ${totalCost}g. (${tax}g tax deducted, shop earned ${netEarnings}g).`,
      });
    }

    if (subcommand === "request_salary") {
      const staffMember = shop.staff.find(
        (s) => s.userId === interaction.user.id
      );
      if (!staffMember) {
        return interaction.reply({
          content: "You're not a staff member.",
          ephemeral: true,
        });
      }

      if (shop.wallet < staffMember.salary) {
        return interaction.reply({
          content: "The shop does not have enough funds to pay your salary.",
          ephemeral: true,
        });
      }

      shop.wallet -= staffMember.salary;
      await shop.save();

      return interaction.reply({
        content: `Salary of ${staffMember.salary}g paid to you.`,
        ephemeral: true,
      });
    }

    if (subcommand === "change_name") {
      if (!isOwner) {
        return interaction.reply({
          content: "❌ You must be the owner to change the shop's name.",
          ephemeral: true,
        });
      }

      const newName = interaction.options.getString("new_name");
      shop.name = newName;
      await shop.save();

      return interaction.reply({
        content: `Shop name changed to **${newName}**.`,
      });
    }
  },
};
