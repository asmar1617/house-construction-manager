const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// Get budget summary (total funds, total expenses, remaining)
router.get('/summary', auth, async (req, res) => {
  const funds = await Budget.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
  const totalFunds = funds[0]?.total || 0;
  const expenses = await Expense.aggregate([
    { $match: { deleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalExpenses = expenses[0]?.total || 0;
  const remaining = totalFunds - totalExpenses;
  res.json({ totalFunds, totalExpenses, remaining });
});

// Add funds
router.post('/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' });
    const entry = new Budget({ amount });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all fund entries
router.get('/all', auth, async (req, res) => {
  const entries = await Budget.find().sort({ date: -1 });
  res.json(entries);
});

module.exports = router; 