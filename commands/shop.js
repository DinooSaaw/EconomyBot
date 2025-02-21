const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Shop = require("../models/Shop");
const User = require("../models/User"); // Assuming User model is available

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Manage and interact with shops.")
    .addSubcommand((sub) =>
      sub
        .setName("info")
        .setDescription("View shop details.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("claim_salary")
        .setDescription("Claim shop salary as the owner.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("set_owner")
        .setDescription("Set the owner of a shop.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("character_name").setDescription("The new owner character name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add_staff")
        .setDescription("Add a staff member to the shop.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("character_name").setDescription("The staff member character name").setRequired(true)
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
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("character_name")
            .setDescription("The staff member character name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("post_item")
        .setDescription("Post an item for sale.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt.setName("price").setDescription("Item price").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Item quantity")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("buy_item")
        .setDescription("Buy an item from the shop.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
        .addNumberOption((opt) =>
          opt
            .setName("quantity")
            .setDescription("Quantity to buy")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("request_salary")
        .setDescription("Request salary from the shop (staff only).")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("change_name")
        .setDescription("Change the shop's name.")
        .addStringOption((opt) =>
          opt
            .setName("shop_name")
            .setDescription("The shop's current name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("new_name")
            .setDescription("The new shop name")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const shopName = interaction.options.getString("shop_name");
    const characterName = interaction.options.getString("character_name");
    const userId = interaction.user.id;

    let shop;
    if (characterName) {
      const character = await User.findOne({ name: characterName });
      if (character) {
        shop = await Shop.findOne({ name: shopName, owner: { id: character.id } });
      }
    } else {
      shop = await Shop.findOne({ name: shopName, closed: { $ne: true } });
    }

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

        const shopList = allShops
          .map((shop) => `${shop.name} - Owned by <@${shop.owner.id}>`)
          .join("\n");

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
        shop.staff.map((s) => `<@${s.userId}>: ${s.salary}g`).join("\n") ||
        "None";
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

      const embed = new EmbedBuilder()
        .setTitle(`${shop.name}`)
        .addFields(embedFields);

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

      const newOwnerName = interaction.options.getString("character_name");
      const newOwner = await User.findOne({ name: newOwnerName });

      if (!newOwner) {
        return interaction.reply({
          content: "Character not found.",
          ephemeral: true,
        });
      }

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

      const staffName = interaction.options.getString("character_name");
      const staff = await User.findOne({ name: staffName });
      const salary = interaction.options.getNumber("salary");

      // Check if the shop has a maxEmployees cap
      if (
        shop.maxEmployees !== null &&
        shop.staff.length >= shop.maxEmployees
      ) {
        return interaction.reply({
          content: `❌ This shop has reached the maximum number of staff members (${shop.maxEmployees}).`,
          ephemeral: true,
        });
      }

      shop.staff.push({ name: staff.username, id: staff.owner.id, salary });
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

      const staffName = interaction.options.getString("character_name");
      const staff = await User.findOne({ name: staffName });

      if (!staff) {
        return interaction.reply({
          content: "Staff member not found.",
          ephemeral: true,
        });
      }

      const staffIndex = shop.staff.findIndex(
        (s) => s.id === staff.owner.id
      );

      if (staffIndex === -1) {
        return interaction.reply({
          content: `${staff.username} is not staff of this shop.`,
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
      if (!userIsStaffOrOwner) {
        return interaction.reply({
          content: "❌ You must be the owner to post items.",
          ephemeral: true,
        });
      }

      const itemName = interaction.options.getString("item");
      const price = interaction.options.getNumber("price");
      const quantity = interaction.options.getNumber("quantity");

      // Check if item already exists
      const existingItemIndex = shop.inventory.findIndex(
        (item) => item.itemName === itemName
      );

      if (existingItemIndex !== -1) {
        shop.inventory[existingItemIndex].quantity += quantity;
      } else {
        shop.inventory.push({ itemName, price, quantity });
      }

      await shop.save();
      return interaction.reply({
        content: `Posted **${itemName}** for ${price}g (x${quantity})`,
      });
    }

    if (subcommand === "buy_item") {
      const itemName = interaction.options.getString("item");
      const quantity = interaction.options.getNumber("quantity");

      const item = shop.inventory.find(
        (i) => i.itemName === itemName && i.quantity >= quantity
      );

      if (!item) {
        return interaction.reply({
          content: `Item not available or insufficient quantity.`,
          ephemeral: true,
        });
      }

      const totalPrice = item.price * quantity;

      // Assuming user has enough balance to make the purchase
      // Deduct the price from the user's balance and update the shop's inventory
      const user = await User.findOne({name: characterName});
      if (user.balance < totalPrice) {
        return interaction.reply({
          content: `You don't have enough funds.`,
          ephemeral: true,
        });
      }

      user.gold -= totalPrice;
      item.quantity -= quantity;

      await user.save();
      await shop.save();

      return interaction.reply({
        content: `You bought **${quantity} ${itemName}(s)** for ${totalPrice}g.`,
      });
    }

    if (subcommand === "request_salary") {
      if (!shop.staff.some((s) => s.id === interaction.user.id)) {
        return interaction.reply({
          content: "You must be a staff member to request salary.",
          ephemeral: true,
        });
      }

      const staffMember = shop.staff.find((s) => s.id === interaction.user.id);
      const salary = staffMember.salary;
      let user = await User.findOne({ name: staff.name });
      // Transfer salary
      shop.wallet -= salary;
      user.balance += salary;

      await shop.save();
      await user.save();

      return interaction.reply({
        content: `You have requested and received ${salary}g.`,
        ephemeral: true,
      });
    }

    if (subcommand === "change_name") {
      if (!isOwner) {
        return interaction.reply({
          content: "❌ You must be the owner to change the shop name.",
          ephemeral: true,
        });
      }

      const newName = interaction.options.getString("new_name");
      shop.name = newName;

      await shop.save();

      return interaction.reply({
        content: `Shop name has been changed to **${newName}**.`,
      });
    }
  },
};
