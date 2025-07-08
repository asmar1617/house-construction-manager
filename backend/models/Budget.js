const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema); 