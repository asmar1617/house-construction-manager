import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', date: '', category: '', notes: '', image: null });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    let url = process.env.REACT_APP_API_URL + '/expenses';
    if (filterCategory) url += `?category=${filterCategory}`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
    const data = await res.json();
    setExpenses(data);
  };
  const fetchCategories = async () => {
    const res = await fetch(process.env.REACT_APP_API_URL + '/categories', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
    const data = await res.json();
    setCategories(data);
  };

  const handleSearch = e => setSearch(e.target.value);
  const handleFilter = e => { setFilterCategory(e.target.value); fetchExpenses(); };

  const filteredExpenses = expenses.filter(e =>
    (!search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())))
  );

  const openForm = (expense = null) => {
    setShowForm(true);
    setEditId(expense ? expense._id : null);
    setForm(expense ? {
      amount: expense.amount,
      description: expense.description,
      date: expense.date.split('T')[0],
      category: expense.category?._id || '',
      notes: expense.notes || '',
      image: null
    } : { amount: '', description: '', date: '', category: '', notes: '', image: null });
    setError('');
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ amount: '', description: '', date: '', category: '', notes: '', image: null }); setError(''); };

  const handleFormChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    const method = editId ? 'PUT' : 'POST';
    const url = process.env.REACT_APP_API_URL + '/expenses' + (editId ? `/${editId}` : '');
    const res = await fetch(url, {
      method,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      body: formData
    });
    if (!res.ok) { setError('Failed to save expense'); return; }
    closeForm();
    fetchExpenses();
  };

  const handleDelete = async id => {
    await fetch(process.env.REACT_APP_API_URL + `/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    fetchExpenses();
  };
  const handleUndo = async id => {
    await fetch(process.env.REACT_APP_API_URL + `/expenses/${id}/undo`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    fetchExpenses();
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Expenses</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="Search..." value={search} onChange={handleSearch} />
          <select value={filterCategory} onChange={handleFilter}>
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
          <button onClick={() => openForm()}>Add Expense</button>
        </div>
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th>Date</th><th>Amount</th><th>Description</th><th>Category</th><th>Notes</th><th>Receipt</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e._id} style={{ opacity: e.deleted ? 0.5 : 1 }}>
                <td>{e.date.split('T')[0]}</td>
                <td>₹{Number(e.amount).toLocaleString()}</td>
                <td>{e.description}</td>
                <td>{e.category?.name}</td>
                <td>{e.notes}</td>
                <td>{e.imageUrl && <a href={e.imageUrl} target="_blank" rel="noopener noreferrer">View</a>}</td>
                <td>
                  {!e.deleted && <button onClick={() => openForm(e)}>Edit</button>}
                  {!e.deleted && <button onClick={() => handleDelete(e._id)}>Delete</button>}
                  {e.deleted && <button onClick={() => handleUndo(e._id)}>Undo</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showForm && (
          <div className="modal">
            <form className="expense-form" onSubmit={handleSubmit}>
              <h2>{editId ? 'Edit' : 'Add'} Expense</h2>
              <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleFormChange} required />
              <input name="description" placeholder="Description" value={form.description} onChange={handleFormChange} required />
              <input name="date" type="date" value={form.date} onChange={handleFormChange} required />
              <select name="category" value={form.category} onChange={handleFormChange} required>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleFormChange} />
              <input name="image" type="file" accept="image/*" onChange={handleFormChange} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Save</button>
                <button type="button" onClick={closeForm}>Cancel</button>
              </div>
              {error && <div className="error">{error}</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses; 