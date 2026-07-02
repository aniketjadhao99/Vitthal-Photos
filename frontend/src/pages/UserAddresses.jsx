import { useState, useEffect } from 'react';
import '../styles/UserAddresses.css';
import Toast from '../components/Toast';

export default function UserAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vitthal_token');
      const response = await fetch('/api/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setAddresses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      showToast('Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';

      const token = localStorage.getItem('vitthal_token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save address');

      showToast(editingId ? 'Address updated successfully' : 'Address added successfully', 'success');
      fetchAddresses();
      resetForm();
    } catch (error) {
      showToast(error.message || 'Error saving address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('vitthal_token');
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete address');

      showToast('Address deleted successfully', 'success');
      fetchAddresses();
    } catch (error) {
      showToast(error.message || 'Error deleting address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vitthal_token');
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) throw new Error('Failed to set default address');

      showToast('Default address updated', 'success');
      fetchAddresses();
    } catch (error) {
      showToast(error.message || 'Error updating default address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="user-addresses-container">
      <div className="addresses-header">
        <h2>My Addresses</h2>
        <button
          className="btn-add-address"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New Address'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {showForm && (
        <div className="address-form-container">
          <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
          <form onSubmit={handleSubmit} className="address-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="2"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Postal Code *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                name="isDefault"
                id="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
              />
              <label htmlFor="isDefault">Set as default address</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Address' : 'Add Address'}
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm && <p className="loading">Loading...</p>}

      {addresses.length === 0 && !showForm && (
        <div className="no-addresses">
          <p>No addresses saved yet. Add your first address to get started.</p>
        </div>
      )}

      <div className="addresses-list">
        {addresses.map(addr => (
          <div key={addr._id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
            {addr.isDefault && <div className="default-badge">Default</div>}
            <div className="address-content">
              <h4>{addr.name}</h4>
              <p className="phone">{addr.phone}</p>
              <p className="address">{addr.address}</p>
              <p className="location">
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p className="country">{addr.country}</p>
            </div>
            <div className="address-actions">
              <button
                className="btn-edit"
                onClick={() => handleEdit(addr)}
                disabled={loading}
              >
                Edit
              </button>
              {!addr.isDefault && (
                <button
                  className="btn-default"
                  onClick={() => handleSetDefault(addr._id)}
                  disabled={loading}
                >
                  Set Default
                </button>
              )}
              <button
                className="btn-delete"
                onClick={() => handleDelete(addr._id)}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
