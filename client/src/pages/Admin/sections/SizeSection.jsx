import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, ArrowUpDown, XCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import Loader from '../../../components/Loader/Loader';

const API_BASE_URL = 'http://localhost:5000/api';

const SizeSection = () => {
  const [sizes, setSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSize, setCurrentSize] = useState({ name: '', unit: '', value: 1, isActive: true });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchSizes();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredSizes = getSortedData(sizes).filter(s => {
    const searchLower = (searchTerm || '').toLowerCase();
    return (s.name || '').toLowerCase().includes(searchLower) ||
      (s.unit || '').toLowerCase().includes(searchLower);
  });

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
      showToast('warning', 'All fields are required');
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
      showToast('success', `Size ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving size:', error);
      showToast('error', error.response?.data?.message || 'Failed to save size');
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirmation(
      'Delete Size?',
      'Are you sure you want to delete this size? This might affect menu items using it.'
    );

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/sizes/${id}`);
        fetchSizes();
        showToast('success', 'Size deleted successfully');
      } catch (error) {
        console.error('Error deleting size:', error);
        showToast('error', 'Failed to delete size');
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
        <div className="p-4 border-b border-border-light bg-background-muted/30">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search sizes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-xs"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 flex items-center space-x-1 px-3 py-1.5 bg-background-muted text-text-muted hover:text-primary rounded-lg border border-border-light transition-all w-fit"
              title="Clear Filters"
            >
              <RotateCcw size={12} />
              <span className="text-[10px] font-black uppercase tracking-wider">Clear</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Size Name</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('unit')}>
                  <div className="flex items-center space-x-1">
                    <span>Unit</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'unit' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('value')}>
                  <div className="flex items-center space-x-1">
                    <span>Value</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'value' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <Loader size="large" />
                      <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading sizes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSizes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted italic">No sizes found</td>
                </tr>
              ) : (
                filteredSizes.map((size) => (
                  <tr key={size._id} className="hover:bg-background-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-text-primary">{size.name}</td>
                    <td className="px-6 py-4 text-text-secondary">{size.unit}</td>
                    <td className="px-6 py-4 font-bold text-text-primary">{size.value}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${size.isActive ? 'bg-status-on/10 text-status-available' : 'bg-status-off/10 text-status-unavailable'
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
                  onChange={(e) => setCurrentSize({ ...currentSize, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                  placeholder="e.g. Quarter, Half, Full, Packet"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Base Unit</label>
                <input
                  type="text"
                  value={currentSize.unit}
                  onChange={(e) => setCurrentSize({ ...currentSize, unit: e.target.value })}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                  placeholder="e.g. piece, plate, kg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Multiplier Value</label>
                <input
                  type="number"
                  value={currentSize.value === 0 ? '' : currentSize.value}
                  onChange={(e) => setCurrentSize({ ...currentSize, value: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
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
                  onClick={() => setCurrentSize({ ...currentSize, isActive: !currentSize.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentSize.isActive ? 'bg-primary' : 'bg-text-muted'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSize.isActive ? 'translate-x-6' : 'translate-x-1'
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
