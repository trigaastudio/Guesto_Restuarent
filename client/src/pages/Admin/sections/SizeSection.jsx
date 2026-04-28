import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, ArrowUpDown, XCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const SizeSection = () => {
  const [sizes, setSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSize, setCurrentSize] = useState({ name: '', unit: '', value: 1, isActive: true });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/sizes`);
      setSizes(response.data);
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (size = { name: '', unit: '', value: 1, isActive: true }) => {
    setCurrentSize({
      ...size,
      isActive: size.isActive !== undefined ? size.isActive : true
    });
    setIsEditing(!!size._id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentSize.name.trim() || !currentSize.unit.trim() || !currentSize.value) {
      alert('All fields are required');
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/sizes/${currentSize._id}`, currentSize);
      } else {
        await axios.post(`${API_BASE_URL}/sizes`, currentSize);
      }
      fetchSizes();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving size:', error);
      alert(error.response?.data?.message || 'Failed to save size');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this size? This might affect menu items using it.')) {
      try {
        await axios.delete(`${API_BASE_URL}/sizes/${id}`);
        fetchSizes();
      } catch (error) {
        console.error('Error deleting size:', error);
        alert('Failed to delete size');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Global Sizes</h2>
          <p className="text-text-secondary text-sm">Define sizes and their multiplier values (e.g., Quarter=1, Half=2, Full=4)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Size</span>
        </button>
      </div>

      <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-6 py-4">Size Name</th>
                <th className="px-6 py-4">Base Unit</th>
                <th className="px-6 py-4">Multiplier Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                  </td>
                </tr>
              ) : sizes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted italic">
                    No sizes defined.
                  </td>
                </tr>
              ) : (
                sizes.map((size) => (
                  <tr key={size._id} className="hover:bg-background-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{size.name}</td>
                    <td className="px-6 py-4 text-text-secondary">{size.unit}</td>
                    <td className="px-6 py-4 font-medium text-primary">{size.value}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        size.isActive ? 'bg-status-on/10 text-status-available' : 'bg-status-off/10 text-status-unavailable'
                      }`}>
                        {size.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleOpenModal(size)} className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(size._id)} className="p-2 hover:bg-status-off/10 text-text-secondary hover:text-status-unavailable rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background-card w-full max-w-md rounded-2xl border border-border-light shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">{isEditing ? 'Edit Size' : 'Add Size'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Size Name</label>
                <input
                  type="text"
                  value={currentSize.name}
                  onChange={(e) => setCurrentSize({...currentSize, name: e.target.value})}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                  placeholder="e.g. Quarter, Half, Full, Packet"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Base Unit</label>
                <input
                  type="text"
                  value={currentSize.unit}
                  onChange={(e) => setCurrentSize({...currentSize, unit: e.target.value})}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                  placeholder="e.g. piece, plate, kg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Multiplier Value</label>
                <input
                  type="number"
                  value={currentSize.value === 0 ? '' : currentSize.value}
                  onChange={(e) => setCurrentSize({...currentSize, value: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                  placeholder="e.g. 1, 2, 4, 10"
                />
                <p className="text-[10px] text-text-muted italic">* How many base units this size contains</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-background-muted/30 rounded-xl border border-border-light">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-text-primary">Active Status</p>
                  <p className="text-[10px] text-text-muted">Blocked sizes won't show in menu editor</p>
                </div>
                <button
                  onClick={() => setCurrentSize({...currentSize, isActive: !currentSize.isActive})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    currentSize.isActive ? 'bg-primary' : 'bg-text-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentSize.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="p-6 bg-background-muted/30 border-t border-border-light flex space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-border-main rounded-xl font-semibold hover:bg-background-card transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light shadow-lg shadow-primary/20 transition-all">
                {isEditing ? 'Save Changes' : 'Create Size'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeSection;
