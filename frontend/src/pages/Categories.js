import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => {
    const res = await fetch(process.env.REACT_APP_API_URL + '/categories', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
    const data = await res.json();
    setCategories(data);
  };

  const handleAdd = async e => {
    e.preventDefault();
    setError('');
    const res = await fetch(process.env.REACT_APP_API_URL + '/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify({ name })
    });
    if (!res.ok) { setError('Failed to add category'); return; }
    setName('');
    fetchCategories();
  };

  const handleEdit = id => {
    setEditId(id);
    setEditName(categories.find(c => c._id === id)?.name || '');
    setError('');
  };
  const handleEditSave = async id => {
    const res = await fetch(process.env.REACT_APP_API_URL + `/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify({ name: editName })
    });
    if (!res.ok) { setError('Failed to update category'); return; }
    setEditId(null); setEditName(''); fetchCategories();
  };
  const handleDelete = async id => {
    await fetch(process.env.REACT_APP_API_URL + `/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    fetchCategories();
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Categories</h1>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder="New category name" value={name} onChange={e => setName(e.target.value)} required />
          <button type="submit">Add</button>
        </form>
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <thead><tr><th>Name</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id}>
                <td>
                  {editId === cat._id ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)} />
                  ) : cat.name}
                </td>
                <td>
                  {editId === cat._id ? (
                    <>
                      <button onClick={() => handleEditSave(cat._id)}>Save</button>
                      <button onClick={() => setEditId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(cat._id)}>Edit</button>
                      <button onClick={() => handleDelete(cat._id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}

export default Categories; 