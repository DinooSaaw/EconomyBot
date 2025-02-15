const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: String, // Shop Name
  owner: {
    id: String, // Discord User ID of the owner
    username: String, // Discord Username of the owner
  },
  wallet: Number, // Gold balance of the shop
  salary: Number, // Amount the shop receives when claimed
  maxEmployees: Number, // Maximum number of employees the shop can have
  staff: [
    {
      userId: String, // Staff Member's ID
      salary: Number, // Salary they receive from shop
    },
  ],
  inventory: [
    {
      itemName: String,
      price: Number,
      quantity: Number,
    },
  ],
});

module.exports = mongoose.model("Shop", ShopSchema);
