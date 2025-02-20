const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: String, // Shop Name
  owner: { type: String, required: true }, // Owner's Name
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
