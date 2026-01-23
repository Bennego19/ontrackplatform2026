import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenManager } from '../services/authMiddleware';
import './AdminAnnouncements.css';

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [updateItems, setUpdateItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // create | read | update | delete
  const [editValues, setEditValues] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState([]);

  const showMessage = (text, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(text);
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrors([{ field: 'general', message: text }]);
      setTimeout(() => setErrors([]), 4000);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const resp = await axios.get('/api/announcements');
      setItems(resp.data || []);
    } catch (err) {
      console.error('Load failed', err);
      showMessage('Failed to load announcements', 'error');
    } finally { setLoading(false); }
  };

  const loadUpdateTable = async () => {
    try {
      const resp = await axios.get('/api/announcements');
      setUpdateItems(resp.data || []);
    } catch (err) {
      console.error('Failed to load update table', err);
    }
  };

  useEffect(() => { load(); loadUpdateTable(); }, []);

  const save = async (e) => {
    e && e.preventDefault();
    const token = tokenManager.getToken();
    try {
      if (!title || !message) { showMessage('Title and message required', 'error'); return; }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('/api/announcements', { title, message }, { headers });
      setTitle(''); setMessage(''); load(); loadUpdateTable(); showMessage('Announcement created');
    } catch (err) {
      console.error('Save failed', err);
      showMessage('Save failed', 'error');
    }
  };

  const handleStartEdit = (it) => {
    setActiveTab('update');
    setEditValues({ id: it.id, title: it.title, message: it.message });
    setEditingId(it.id);
  };

  const handleUpdateSave = async (id) => {
    const vals = editValues || {};
    if (!vals.title || !vals.message) { showMessage('Title and message required', 'error'); return; }
    try {
      const token = tokenManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`/api/announcements/${id}`, { title: vals.title, message: vals.message }, { headers });
      setEditValues({}); setEditingId(null); setActiveTab('read'); load(); loadUpdateTable(); showMessage('Announcement updated');
    } catch (err) {
      console.error('Update failed', err);
      showMessage('Update failed', 'error');
    }
  };

  const handleDeleteSubmit = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const token = tokenManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`/api/announcements/${id}`, { headers });
      showMessage('Announcement deleted');
      load(); loadUpdateTable();
    } catch (err) {
      console.error('Delete failed', err);
      showMessage('Delete failed', 'error');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors([]);
    setSuccessMessage('');
    if (tab === 'read') load();
    if (tab === 'update') loadUpdateTable();
    if (tab === 'delete') load();
  };

  return (
    <div className="manage-mentorship-container">
      <div className="manage-mentorship-card">
        <div className="manage-mentorship-header">
          <div className="header-icon">📢</div>
          <h1 className="manage-mentorship-title">Manage Announcements</h1>
          <p className="manage-mentorship-subtitle">Create and manage site-wide announcements</p>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}
        {errors.some(e => e.field === 'general') && (
          <div className="error-message general-error">{errors.filter(e=>e.field==='general').map((err,idx)=>(<div key={idx}>{err.message}</div>))}</div>
        )}

        <div className="tab-container-mentorship">
          <div className="tabs-mentorship">
            <button className={`tab-mentorship ${activeTab === 'create' ? 'active' : ''}`} onClick={() => handleTabChange('create')}>Create Announcement</button>
            <button className={`tab-mentorship ${activeTab === 'read' ? 'active' : ''}`} onClick={() => handleTabChange('read')}>View Announcements</button>
            <button className={`tab-mentorship ${activeTab === 'update' ? 'active' : ''}`} onClick={() => handleTabChange('update')}>Update Announcements</button>
            <button className={`tab-mentorship ${activeTab === 'delete' ? 'active' : ''}`} onClick={() => handleTabChange('delete')}>Delete Announcement</button>
          </div>

          <div className="tab-content-mentorship">
            {/* CREATE TAB */}
            {activeTab === 'create' && (
              <div className="tab-pane-mentorship active">
                <div className="form-section">
                  <h3 className="section-title">Create New Announcement</h3>
                  <form onSubmit={save} className="mentorship-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input type="text" className="form-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Announcement title" required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea className="form-input" value={message} onChange={(e)=>setMessage(e.target.value)} rows={5} placeholder="Announcement message" required />
                      </div>
                    </div>
                    <div className="action-section">
                      <button type="submit" className="submit-button">➕ Create Announcement</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* READ TAB */}
            {activeTab === 'read' && (
              <div className="tab-pane-mentorship active">
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">View Announcements</h3>
                    <button onClick={load} className="refresh-button">🔄 Refresh</button>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Message</th>
                          <th>Posted At</th>
                        </tr>
                      </thead>
                      <tbody>
                          {items.map(it => (
                            <tr key={it.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{it.title}</div>
                                <div style={{ fontSize: 12, color: '#aab6c6' }}>Date: {it.postedAt ? new Date(it.postedAt).toLocaleDateString() : ''}</div>
                                <div style={{ marginTop: 6, color: '#dbe9ff' }}>{it.message ? (it.message.length > 140 ? it.message.slice(0,137) + '...' : it.message) : ''}</div>
                              </td>
                              <td>{it.postedAt ? new Date(it.postedAt).toLocaleString() : ''}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {items.length === 0 && (<div className="no-data-message">No announcements found.</div>)}
                  </div>
                </div>
              </div>
            )}

            {/* UPDATE TAB */}
            {activeTab === 'update' && (
              <div className="tab-pane-mentorship active">
                <div className="form-section">
                  <h3 className="section-title">Update Announcements</h3>
                  <p className="section-subtitle">Edit announcement details and save changes</p>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Message</th>
                          <th>Posted At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                          {updateItems.map(it => (
                            <tr key={it.id}>
                              <td>{it.id}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{it.title}</div>
                                <div style={{ fontSize: 12, color: '#aab6c6' }}>Date: {it.postedAt ? new Date(it.postedAt).toLocaleDateString() : ''}</div>
                                <div style={{ marginTop: 6, color: '#dbe9ff' }}>{it.message ? (it.message.length > 140 ? it.message.slice(0,137) + '...' : it.message) : ''}</div>
                              </td>
                              <td>
                                <input className="update-input" defaultValue={it.title} onChange={(e)=>setEditValues(prev=>({...prev,[it.id]:{...(prev[it.id]||{}),title:e.target.value}}))} />
                                <input className="update-input" defaultValue={it.message} onChange={(e)=>setEditValues(prev=>({...prev,[it.id]:{...(prev[it.id]||{}),message:e.target.value}}))} />
                              </td>
                              <td>{it.postedAt ? new Date(it.postedAt).toLocaleString() : ''}</td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={() => handleUpdateSave(it.id)} className="update-btn">💾 Save</button>
                                  <button onClick={() => { setEditValues(prev=>{ const c = {...prev}; delete c[it.id]; return c; }); }} className="cancel-btn">❌ Cancel</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {updateItems.length === 0 && (<div className="no-data-message">No announcements available for update.</div>)}
                  </div>
                </div>
              </div>
            )}

            {/* DELETE TAB */}
            {activeTab === 'delete' && (
              <div className="tab-pane-mentorship active">
                <div className="form-section">
                  <h3 className="section-title">Delete Announcement</h3>
                  <p className="section-subtitle">Permanently remove an announcement from the system</p>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Message</th>
                          <th>Posted At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                          {items.map(it => (
                            <tr key={it.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{it.title}</div>
                                <div style={{ fontSize: 12, color: '#aab6c6' }}>Date: {it.postedAt ? new Date(it.postedAt).toLocaleDateString() : ''}</div>
                                <div style={{ marginTop: 6, color: '#dbe9ff' }}>{it.message ? (it.message.length > 140 ? it.message.slice(0,137) + '...' : it.message) : ''}</div>
                              </td>
                              <td>{it.postedAt ? new Date(it.postedAt).toLocaleDateString() : ''}</td>
                              <td>
                                <button onClick={() => handleDeleteSubmit(it.id)} className="delete-btn">🗑️ Delete</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {items.length === 0 && (<div className="no-data-message">No announcements available for deletion.</div>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
