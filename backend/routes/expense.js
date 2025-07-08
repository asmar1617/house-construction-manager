const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const { uploadImage } = require('../utils/cloudinary');

const upload = multer({ dest: 'uploads/' });

// Get all expenses (optionally filter by category)
router.get('/', auth, async (req, res) => {
  const { category } = req.query;
  let filter = { deleted: false };
  if (category) filter.category = category;
  const expenses = await Expense.find(filter).populate('category').sort({ date: -1 });
  res.json(expenses);
});

// Get single expense
router.get('/:id', auth, async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('category');
  if (!expense || expense.deleted) return res.status(404).json({ message: 'Expense not found' });
  res.json(expense);
});

// Create expense
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { amount, description, date, category, notes } = req.body;
    let imageUrl = '';
    if (req.file) {
      const result = await uploadImage(req.file.path);
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // Remove local file
    }
    const expense = new Expense({
      amount,
      description,
      date,
      category,
      imageUrl,
      notes,
    });
    await expense.save();
    res.status(201).json(await expense.populate('category'));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { amount, description, date, category, notes } = req.body;
    let update = { amount, description, date, category, notes };
    if (req.file) {
      const result = await uploadImage(req.file.path);
      update.imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }
    const expense = await Expense.findByIdAndUpdate(req.params.id, update, { new: true }).populate('category');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted (soft)' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Undo soft delete
router.post('/:id/undo', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { deleted: false }, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense restored' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 