const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;

router.get('/expenses', auth, async (req, res) => {
  const expenses = await Expense.find({ deleted: false }).populate('category').sort({ date: -1 });
  const csvWriter = createCsvWriter({
    header: [
      { id: 'date', title: 'Date' },
      { id: 'amount', title: 'Amount' },
      { id: 'description', title: 'Description' },
      { id: 'category', title: 'Category' },
      { id: 'notes', title: 'Notes' },
      { id: 'imageUrl', title: 'Receipt Image URL' }
    ]
  });
  const records = expenses.map(e => ({
    date: e.date.toISOString().split('T')[0],
    amount: e.amount,
    description: e.description,
    category: e.category?.name || '',
    notes: e.notes || '',
    imageUrl: e.imageUrl || ''
  }));
  const csv = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.send(csv);
});

module.exports = router; 