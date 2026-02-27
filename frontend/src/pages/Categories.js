import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const api = process.env.REACT_APP_API_URL || '/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const res = await fetch(api + '/categories/');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  const handleAdd = async e => {
    e.preventDefault();
    setError('');
    const res = await fetch(api + '/categories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || data.name?.[0] || 'Failed to add category'); return; }
    setName('');
    fetchCategories();
  };

  const handleEdit = cat => {
    setEditId(cat.id);
    setEditName(cat.name);
    setError('');
  };
  const handleEditSave = async () => {
    const res = await fetch(api + `/categories/${editId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    });
    if (!res.ok) { setError('Failed to update'); return; }
    setEditId(null);
    setEditName('');
    fetchCategories();
  };
  const handleDelete = async id => {
    await fetch(api + `/categories/${id}/`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-header">
          <h1>Categories</h1>
          <p>Manage expense categories</p>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAdd} className="form-row">
            <input
              placeholder="New category name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <button type="submit">Add category</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No categories yet. Add one above.</td></tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      {editId === cat.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          style={{ maxWidth: '200px' }}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="actions">
                      {editId === cat.id ? (
                        <>
                          <button type="button" className="small" onClick={handleEditSave}>Save</button>
                          <button type="button" className="small secondary" onClick={() => setEditId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="small secondary" onClick={() => handleEdit(cat)}>Edit</button>
                          <button type="button" className="small danger" onClick={() => handleDelete(cat.id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Categories;
