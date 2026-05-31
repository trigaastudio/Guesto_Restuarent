import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axiosInstance';
import { Plus, Edit2, Trash2, RefreshCw, Users, Hash, Search, RotateCcw, XCircle } from 'lucide-react';
import Loader from '../../../components/Loader/Loader';
import { showToast } from '../../../utils/sweetAlert';
import Swal from 'sweetalert2';

const TableSection = ({ refreshKey }) => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    tableNumber: '',
    capacity: 4
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const tableNumberRef = useRef(null);
  const capacityRef = useRef(null);

  const fetchTables = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/tables?all=true');
      setTables(response.data);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables(refreshKey > 0);
  }, [refreshKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const openModal = (table = null) => {
    if (table) {
      setFormData({
        _id: table._id,
        tableNumber: table.tableNumber.toString(),
        capacity: table.capacity.toString()
      });
    } else {
      setFormData({
        _id: '',
        tableNumber: '',
        capacity: '4'
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (!formData.tableNumber) {
      newErrors.tableNumber = 'Table Number is required';
    } else if (!alphanumericRegex.test(formData.tableNumber)) {
      newErrors.tableNumber = 'Only letters and numbers are allowed';
    } else {
      const exists = tables.some(t => t.tableNumber.toString().toLowerCase() === formData.tableNumber.toString().toLowerCase() && t._id !== formData._id);
      if (exists) {
        newErrors.tableNumber = 'Table number already exists';
      }
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Seating capacity is required';
    } else if (parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        if (newErrors.tableNumber && tableNumberRef.current) tableNumberRef.current.focus();
        else if (newErrors.capacity && capacityRef.current) capacityRef.current.focus();
      }, 0);
      return;
    }
    setErrors({});

    try {
      if (formData._id) {
        await api.put(`/api/tables/${formData._id}`, {
          tableNumber: formData.tableNumber,
          capacity: parseInt(formData.capacity)
        });
        showToast('success', 'Table updated successfully');
      } else {
        await api.post('/api/tables', {
          tableNumber: formData.tableNumber,
          capacity: parseInt(formData.capacity)
        });
        showToast('success', 'Table created successfully');
      }
      setIsModalOpen(false);
      fetchTables(true);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleActive = async (table) => {
    const newIsActive = table.isActive === false ? true : false;
    
    // Optimistic UI update
    setTables(prevTables => 
      prevTables.map(t => 
        t._id === table._id ? { ...t, isActive: newIsActive } : t
      )
    );

    try {
      await api.put(`/api/tables/${table._id}`, {
        isActive: newIsActive
      });
    } catch (error) {
      // Revert on error
      setTables(prevTables => 
        prevTables.map(t => 
          t._id === table._id ? { ...t, isActive: table.isActive } : t
        )
      );
      showToast('error', error.response?.data?.message || 'Failed to update table status');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the table.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--color-background-card)',
      color: 'var(--color-text-primary)',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/tables/${id}`);
        showToast('success', 'Table deleted successfully');
        fetchTables(true);
      } catch (error) {
        showToast('error', error.response?.data?.message || 'Failed to delete table');
      }
    }
  };

  const filteredTables = tables.filter(t => {
    const term = searchTerm.toLowerCase();
    return t.tableNumber.toString().includes(term) ||
      t.capacity.toString().includes(term) ||
      (t.status || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Table Inventory</h2>
          <p className="text-text-secondary text-sm">Create and manage restaurant dining tables</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Table</span>
        </button>
      </div>

      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by table number, capacity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setSearchTerm(''); }}
              disabled={!searchTerm}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${
                !searchTerm
                  ? 'bg-background-muted/50 text-text-muted/30 border-border-light cursor-not-allowed'
                  : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white'
              }`}
              title="Clear All Filters"
            >
              <RotateCcw size={12} />
              <span className="text-[10px] font-black uppercase tracking-wider">Clear Filters</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-black tracking-widest border-b border-border-light">
              <tr>
                <th className="px-6 py-4">Table Number</th>
                <th className="px-6 py-4">Seating Capacity</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <Loader size="large" />
                      <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading tables...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted italic">No tables found</td>
                </tr>
              ) : (
                filteredTables.map((table) => (
                  <tr key={table._id} className="hover:bg-background-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                          T-{table.tableNumber}
                        </div>
                        <span className="font-bold text-text-primary">Table {table.tableNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <Users size={16} className="text-text-muted" />
                        <span className="font-bold">{table.capacity} Persons</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        table.isActive === false 
                          ? 'bg-status-off/10 text-status-unavailable border-status-off/20' 
                          : 'bg-status-on/10 text-status-available border-status-on/20'
                      }`}>
                        {table.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => handleToggleActive(table)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            table.isActive !== false ? 'bg-status-available border border-status-on/20' : 'bg-background-muted/80 border border-border-main'
                          }`}
                          title={table.isActive !== false ? "Active (Shown to waiters)" : "Inactive (Hidden from waiters)"}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                              table.isActive !== false ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex items-center space-x-1">
                          <button onClick={() => openModal(table)} className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all" title="Edit Table">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(table._id)} className="p-2 hover:bg-status-off/10 text-text-secondary hover:text-status-unavailable rounded-lg transition-all" title="Delete Table">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
          <div className="bg-background-card w-full max-w-md rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <h3 className="text-xl font-black text-text-primary">
                {formData._id ? 'Edit Table Details' : 'Add New Dining Table'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${errors.tableNumber ? 'text-primary' : 'text-text-muted'}`}>Table Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      ref={tableNumberRef}
                      type="text"
                      name="tableNumber"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all text-sm font-bold text-text-primary ${
                        errors.tableNumber 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border-main focus:border-primary'
                      }`}
                      placeholder="e.g. 1"
                    />
                  </div>
                  {errors.tableNumber && <p className="text-[10px] font-bold text-primary mt-1">{errors.tableNumber}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 ${errors.capacity ? 'text-primary' : 'text-text-muted'}`}>Seating Capacity</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      ref={capacityRef}
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all text-sm font-bold text-text-primary ${
                        errors.capacity 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border-main focus:border-primary'
                      }`}
                      placeholder="e.g. 4"
                    />
                  </div>
                  {errors.capacity && <p className="text-[10px] font-bold text-primary mt-1">{errors.capacity}</p>}
                </div>
              </div>

              <div className="p-8 bg-background-muted/30 border-t border-border-light flex space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-border-main text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {formData._id ? 'Update Table' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSection;
