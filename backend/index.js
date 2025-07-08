const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Routers
app.use('/api/expenses', require('./routes/expense'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/export', require('./routes/export'));

app.get('/', (req, res) => {
  res.send('Construction Expense Management API is running.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 