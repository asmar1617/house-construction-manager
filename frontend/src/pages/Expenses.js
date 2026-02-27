import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const api = process.env.REACT_APP_API_URL || '/api';
const getAuthHeaders = () => {
  const t = localStorage.getItem('construction_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

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

  useEffect(() => {
    if (filterCategory !== undefined) fetchExpenses();
  }, [filterCategory]);

  const fetchExpenses = async () => {
    let url = api + '/expenses/';
    if (filterCategory) url += `?category=${filterCategory}`;
    const res = await fetch(url);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
  };
  const fetchCategories = async () => {
    const res = await fetch(api + '/categories/');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  const handleFilter = e => { setFilterCategory(e.target.value); };
  const filteredExpenses = expenses.filter(e =>
    !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const id = e => e.id != null ? e.id : e._id;
  const openForm = (expense = null) => {
    setShowForm(true);
    setEditId(expense ? id(expense) : null);
    setForm(expense ? {
      amount: expense.amount,
      description: expense.description,
      date: (expense.date || '').split('T')[0],
      category: expense.category || '',
      notes: expense.notes || '',
      image: null
    } : { amount: '', description: '', date: new Date().toISOString().split('T')[0], category: '', notes: '', image: null });
    setError('');
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setError(''); };

  const handleFormChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('amount', form.amount);
    formData.append('description', form.description);
    formData.append('date', form.date);
    formData.append('category', form.category);
    if (form.notes) formData.append('notes', form.notes);
    if (form.image) formData.append('image', form.image);

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${api}/expenses/${editId}/` : `${api}/expenses/`;
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: formData });
    if (!res.ok) { setError('Failed to save'); return; }
    closeForm();
    fetchExpenses();
  };

  const handleDelete = async expenseId => {
    await fetch(`${api}/expenses/${expenseId}/`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchExpenses();
  };
  const handleUndo = async expenseId => {
    await fetch(`${api}/expenses/${expenseId}/undo/`, { method: 'POST', headers: getAuthHeaders() });
    fetchExpenses();
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Expenses</h1>
          <p>Track and manage construction expenses</p>
          <button type="button" onClick={() => openForm()} className="page-header-action">Add expense</button>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-row">
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '220px' }} />
            <select value={filterCategory} onChange={handleFilter} style={{ maxWidth: '180px' }}>
              <option value="">All categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Category</th>
                <th>Notes</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No expenses yet. Add one to get started.</td></tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={id(e)} style={{ opacity: e.deleted ? 0.6 : 1 }}>
                    <td>{(e.date || '').split('T')[0]}</td>
                    <td><strong>Rs.{Number(e.amount).toLocaleString('en-PK')}</strong></td>
                    <td>{e.description}</td>
                    <td>{e.category_name || e.category?.name || '—'}</td>
                    <td>{e.notes || '—'}</td>
                    <td className="actions">
                      {!e.deleted && (
                        <>
                          <button type="button" className="small secondary" onClick={() => openForm(e)}>Edit</button>
                          <button type="button" className="small danger" onClick={() => handleDelete(id(e))}>Delete</button>
                        </>
                      )}
                      {e.deleted && (
                        <button type="button" className="small" onClick={() => handleUndo(id(e))}>Undo</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="modal" onClick={closeForm}>
            <div className="modal-content" onClick={ev => ev.stopPropagation()}>
              <h2>{editId ? 'Edit' : 'Add'} expense</h2>
              <form onSubmit={handleSubmit}>
                <input name="amount" type="number" step="0.01" placeholder="Amount (Rs.)" value={form.amount} onChange={handleFormChange} required />
                <input name="description" placeholder="Description" value={form.description} onChange={handleFormChange} required />
                <input name="date" type="date" value={form.date} onChange={handleFormChange} required />
                <select name="category" value={form.category} onChange={handleFormChange} required>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <textarea name="notes" placeholder="Notes (optional)" value={form.notes} onChange={handleFormChange} rows="2" />
                <input name="image" type="file" accept="image/*" onChange={handleFormChange} />
                <div className="modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" className="secondary" onClick={closeForm}>Cancel</button>
                </div>
                {error && <div className="error">{error}</div>}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Expenses;
