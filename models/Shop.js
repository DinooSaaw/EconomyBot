const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: String, // Shop Name
  owner: { type: String, required: true }, // Owner's Name
  wallet: { type: Number, default: 0 }, // Gold balance of the shop
  salary: { type: Number, default: 0 }, // Amount the shop receives when claimed
  maxEmployees: Number, // Maximum number of employees the shop can have
  staff: [
    {
      name: String, // Staff Member's Name
      id: String, // Staff Member's ID
      salary: Number, // Salary they receive from the shop
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
