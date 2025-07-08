const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  imageUrl: { type: String },
  notes: { type: String },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema); 