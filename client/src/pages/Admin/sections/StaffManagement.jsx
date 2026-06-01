import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, User, Mail, Phone, Shield, Power, Loader2, ArrowUpDown, XCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import Loader from '../../../components/Loader/Loader';
import Pagination from '../../../components/Pagination/Pagination';



const StaffRow = React.memo(({ staff, handleToggleStatus, handleOpenModal, handleDelete }) => {
  return (
    <tr className="hover:bg-background-muted/30 transition-colors group">
      <td className="px-3 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {staff.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-text-primary">{staff.name}</span>
            <span className="text-[10px] text-text-muted uppercase">{staff.email || 'No Email'}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-4">
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${staff.role === 'kitchen' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            staff.role === 'waiter' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
              staff.role === 'delivery' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                'bg-purple-500/10 text-purple-500 border-purple-500/20'
          }`}>
          {staff.role}
        </span>
      </td>
      <td className="px-3 py-4 font-mono font-bold text-text-primary">{staff.employeeId}</td>
      <td className="px-3 py-4 text-text-secondary text-xs">
        <div className="flex flex-col">
          <span className="flex items-center space-x-1"><Phone size={10} /> <span>{staff.phoneNumber}</span></span>
        </div>
      </td>
      <td className="px-3 py-4 text-center">
        <button
          onClick={() => handleToggleStatus(staff)}
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all ${staff.isActive ? 'bg-status-off/10 text-status-unavailable border-status-off/20 hover:bg-status-off/20' : 'bg-status-on/10 text-status-available border-status-on/20 hover:bg-status-on/20'
            }`}
          title={staff.isActive ? 'Block Staff' : 'Unblock Staff'}
        >
          {staff.isActive ? 'Block' : 'Unblock'}
        </button>
      </td>
      <td className="px-3 py-4 text-center">
        <div className="flex items-center justify-center space-x-1">
          <button onClick={() => handleOpenModal(staff)} className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all">
            <Edit2 size={18} />
          </button>
          <button onClick={() => handleDelete(staff._id)} className="p-2 hover:bg-status-off/10 text-text-secondary hover:text-status-unavailable rounded-lg transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
});

const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [errors, setErrors] = useState({});

  const [currentStaff, setCurrentStaff] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    employeeId: '',
    role: 'waiter',
    password: '',
    isActive: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchStaff = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/staff');
      setStaffList(response.data.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      showToast('error', 'Failed to fetch staff list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOpenModal = useCallback((staff = null) => {
    if (staff) {
      setCurrentStaff({
        ...staff,
        password: '' // Don't show hashed password
      });
      setIsEditing(true);
    } else {
      setCurrentStaff({
        name: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        role: 'waiter',
        password: '',
        isActive: true
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  }, []);

  const handleSave = async () => {
    const newErrors = {};
    if (!currentStaff.name || !currentStaff.name.trim()) newErrors.name = true;
    if (!currentStaff.employeeId || !currentStaff.employeeId.trim()) newErrors.employeeId = true;
    if (!isEditing && (!currentStaff.password || !currentStaff.password.trim()) && currentStaff.role !== 'delivery') newErrors.password = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('warning', 'Please fill all required fields');
      return;
    }
    setErrors({});

    const payload = { ...currentStaff };
    if (!isEditing && payload.role === 'delivery' && !payload.password) {
      payload.password = 'delivery123'; 
    }

    try {
      if (isEditing) {
        
        const updateData = { ...currentStaff };
        if (!updateData.password) delete updateData.password;

        await api.put(`/api/staff/${currentStaff._id}`, updateData);
        showToast('success', 'Staff updated successfully');
      } else {
        await api.post('/api/staff', payload);
        showToast('success', 'Staff created successfully');
      }
      fetchStaff(true);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving staff:', error);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: error.response?.data?.message || 'Failed to save staff details'
      });
    }
  };

  const handleDelete = useCallback(async (id) => {
    const result = await showDeleteConfirmation('Remove Staff?', 'This action cannot be undone.');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/staff/${id}`);
        showToast('success', 'Staff removed successfully');
        fetchStaff(true);
      } catch (error) {
        showToast('error', 'Failed to remove staff');
      }
    }
  }, [fetchStaff]);

  const handleToggleStatus = useCallback(async (staff) => {
    const newIsActive = !staff.isActive;
    
    
    setStaffList(prevList => 
      prevList.map(s => 
        s._id === staff._id ? { ...s, isActive: newIsActive } : s
      )
    );

    try {
      const updateData = { ...staff, isActive: newIsActive };
      await api.put(`/api/staff/${staff._id}`, updateData);
      showToast('success', `Staff ${newIsActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      
      setStaffList(prevList => 
        prevList.map(s => 
          s._id === staff._id ? { ...s, isActive: !newIsActive } : s
        )
      );
      showToast('error', 'Failed to update status');
    }
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Staff Management</h2>
          <p className="text-text-secondary text-sm">Create and manage access for kitchen and waiters</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add New Staff</span>
        </button>
      </div>

      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by name or Employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
            >
              <option value="all">All Roles</option>
              <option value="kitchen">Kitchen</option>
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="delivery">Delivery Boy</option>
            </select>
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
              disabled={!searchTerm && roleFilter === 'all'}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${!searchTerm && roleFilter === 'all'
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
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Staff Member</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-3 py-4">Role</th>
                <th className="px-3 py-4">Employee ID</th>
                <th className="px-3 py-4">Contact</th>
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <Loader size="large" />
                      <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading staff...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-text-muted italic">No staff found</td>
                </tr>
              ) : (
                paginatedStaff.map((staff) => (
                  <StaffRow 
                    key={staff._id} 
                    staff={staff} 
                    handleToggleStatus={handleToggleStatus} 
                    handleOpenModal={handleOpenModal} 
                    handleDelete={handleDelete} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <h3 className="text-xl font-black text-text-primary">{isEditing ? 'Edit Staff Member' : 'Add New Staff'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${errors.name ? 'text-primary' : 'text-text-muted'}`}>Full Name</label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.name ? 'text-primary' : 'text-text-muted'}`} size={14} />
                    <input
                      type="text"
                      value={currentStaff.name}
                      onChange={(e) => {
                        setCurrentStaff({ ...currentStaff, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: false });
                      }}
                      className={`w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all text-sm font-bold ${
                        errors.name 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border-main focus:border-primary'
                      }`}
                      placeholder="Enter name"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-primary">Name is required</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <select
                      value={currentStaff.role}
                      onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="cashier">Cashier</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${errors.employeeId ? 'text-primary' : 'text-text-muted'}`}>Employee ID (Login ID)</label>
                  <input
                    type="text"
                    value={currentStaff.employeeId}
                    onChange={(e) => {
                      setCurrentStaff({ ...currentStaff, employeeId: e.target.value });
                      if (errors.employeeId) setErrors({ ...errors, employeeId: false });
                    }}
                    className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all text-sm font-bold ${
                      errors.employeeId 
                        ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                        : 'border-border-main focus:border-primary'
                    }`}
                    placeholder="e.g. KS001"
                    disabled={isEditing}
                  />
                  {errors.employeeId && <p className="text-[10px] font-bold text-primary">Employee ID is required</p>}
                </div>
                {currentStaff.role !== 'delivery' && (
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${errors.password ? 'text-primary' : 'text-text-muted'}`}>Password</label>
                    <input
                      type="password"
                      value={currentStaff.password}
                      onChange={(e) => {
                        setCurrentStaff({ ...currentStaff, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: false });
                      }}
                      className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all text-sm font-bold ${
                        errors.password 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border-main focus:border-primary'
                      }`}
                      placeholder={isEditing ? "Leave blank to keep same" : "Min 6 chars"}
                    />
                    {errors.password && <p className="text-[10px] font-bold text-primary">Password is required</p>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      type="text"
                      value={currentStaff.phoneNumber}
                      onChange={(e) => setCurrentStaff({ ...currentStaff, phoneNumber: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      type="text"
                      value={currentStaff.email}
                      onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-8 bg-background-muted/30 border-t border-border-light flex space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border border-border-main text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-background-card transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isEditing ? 'Update Staff' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
