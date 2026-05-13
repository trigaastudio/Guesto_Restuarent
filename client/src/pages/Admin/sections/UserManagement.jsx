import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User, Mail, Phone, Power, Loader2, ArrowUpDown, XCircle, Ban, CheckCircle, CheckCircle2, MapPin, ExternalLink, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import Loader from '../../../components/Loader/Loader';
import Pagination from '../../../components/Pagination/Pagination';

const UserManagement = () => {
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [currentUser, setCurrentUser] = useState({
    name: '',
    password: '',
    isActive: true,
    addresses: [{
      address: '',
      location: '',
      type: 'home',
      isDefault: true
    }]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/users');
      setUserList(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Failed to load users');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser({
        ...user,
        password: '',
        addresses: user.addresses?.length > 0 ? user.addresses : [{
          address: '',
          location: '',
          type: 'home',
          isDefault: true
        }]
      });
      setIsEditing(true);
    } else {
      setCurrentUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        isActive: true,
        addresses: [{
          address: '',
          location: '',
          type: 'home',
          isDefault: true
        }]
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentUser.name || (!currentUser.email && !currentUser.phone) || (!isEditing && !currentUser.password)) {
      showToast('warning', 'Name and (Email or Phone) are required');
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/api/users/${currentUser._id}`, currentUser);
      } else {
        await api.post('/api/users', currentUser);
      }
      fetchUsers(true);
      setIsModalOpen(false);
      showToast('success', `User ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving user:', error);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: error.response?.data?.message || 'Failed to save user details'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirmation('Remove User?', 'This action cannot be undone. User data will be permanently deleted.');
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsers(true);
        showToast('success', 'User deleted successfully');
      } catch (error) {
        showToast('error', 'Failed to remove user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await api.patch(`/api/users/${id}/toggle-status`);
      showToast('success', response.data.message);
      fetchUsers(true);
    } catch (error) {
      showToast('error', 'Failed to update user status');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = userList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'blocked' && !u.isActive);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">User Management</h2>
          <p className="text-text-secondary text-sm">Manage your customers and app users</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-background-card rounded-[2rem] border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              disabled={!searchTerm && statusFilter === 'all'}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${
                !searchTerm && statusFilter === 'all'
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
                    <span>User</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('email')}>
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'email' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-3 py-4">Phone</th>
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('createdAt')}>
                  <div className="flex items-center space-x-1 justify-center">
                    <span>Joined</span>
                    <ArrowUpDown size={12} className={sortConfig.key === 'createdAt' ? 'text-primary' : 'text-text-muted'} />
                  </div>
                </th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <Loader size="large" />
                      <p className="text-text-secondary text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-text-muted italic">No users found</td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-background-muted/30 transition-colors group">
                    <td className="px-3 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.isActive ? 'bg-primary/10 text-primary' : 'bg-status-off/10 text-status-unavailable'}`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold ${user.isActive ? 'text-text-primary' : 'text-text-muted line-through'}`}>{user.name}</span>
                          <span className="text-[10px] text-text-muted uppercase">ID: {user._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-3 py-4 text-text-secondary text-xs">
                      <div className="flex items-center space-x-1">
                        <Phone size={10} />
                        <span>{user.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${user.isActive ? 'bg-status-on/10 text-status-available border-status-on/20' : 'bg-status-off/10 text-status-unavailable border-status-off/20'
                        }`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-text-muted text-[10px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`p-2 rounded-lg transition-all ${user.isActive ? 'hover:bg-status-off/10 text-text-secondary hover:text-status-unavailable' : 'hover:bg-status-on/10 text-text-secondary hover:text-status-available'}`}
                          title={user.isActive ? "Block User" : "Unblock User"}
                        >
                          {user.isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button onClick={() => handleOpenModal(user)} className="p-2 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-lg transition-all" title="Edit User">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-status-off/10 text-text-secondary hover:text-status-unavailable rounded-lg transition-all" title="Delete User">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden">
          <div className="bg-background-card w-full max-w-lg rounded-[2.5rem] border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <h3 className="text-xl font-black text-text-primary">{isEditing ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    value={currentUser.name}
                    onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      type="email"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                    <input
                      type="text"
                      value={currentUser.phone}
                      onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                      placeholder="10-digit number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  value={currentUser.password}
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm font-bold"
                  placeholder={isEditing ? "Leave blank to keep same" : "Min 6 chars"}
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setCurrentUser({ ...currentUser, isActive: !currentUser.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentUser.isActive ? 'bg-primary' : 'bg-text-muted'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentUser.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
                <span className="text-xs font-bold text-text-primary uppercase tracking-widest">
                  {currentUser.isActive ? 'Account Active' : 'Account Blocked'}
                </span>
              </div>

              <div className="pt-4 border-t border-border-light space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Delivery Profile</h4>

                <div className="space-y-4 pt-4 border-t border-border-light">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-text-muted font-black uppercase tracking-widest">Delivery Addresses</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newAddresses = [...(currentUser.addresses || [])];
                        newAddresses.push({ address: '', location: '', type: 'home', isDefault: newAddresses.length === 0 });
                        setCurrentUser({ ...currentUser, addresses: newAddresses });
                      }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-primary hover:text-primary-light transition-colors"
                    >
                      <Plus size={12} />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentUser.addresses || []).map((addr, idx) => (
                      <div
                        key={idx}
                        className={`group relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${addr.isDefault
                            ? 'bg-primary/[0.03] border-primary/30 shadow-[0_8px_30px_rgb(var(--color-primary-rgb),0.05)]'
                            : 'bg-background-muted/20 border-border-light hover:border-primary/20 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <select
                                value={addr.type}
                                onChange={(e) => {
                                  const newAddresses = [...currentUser.addresses];
                                  newAddresses[idx].type = e.target.value;
                                  setCurrentUser({ ...currentUser, addresses: newAddresses });
                                }}
                                className="appearance-none pl-3 pr-8 py-1.5 bg-background-card rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 outline-none cursor-pointer hover:bg-primary/5 transition-all"
                              >
                                <option value="home">Home</option>
                                <option value="office">Office</option>
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-primary opacity-50">
                                <Plus size={10} className="rotate-45" />
                              </div>
                            </div>
                            {addr.isDefault && (
                              <div className="flex items-center space-x-1.5 bg-primary px-3 py-1.5 rounded-full shadow-lg shadow-primary/20">
                                <CheckCircle2 size={10} className="text-white" />
                                <span className="text-white text-[8px] font-black uppercase tracking-[0.1em]">Default Address</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newAddresses = currentUser.addresses.map((a, i) => ({
                                    ...a,
                                    isDefault: i === idx
                                  }));
                                  setCurrentUser({ ...currentUser, addresses: newAddresses });
                                }}
                                className="px-3 py-1.5 rounded-full text-[9px] font-black text-primary hover:bg-primary/10 transition-all uppercase tracking-widest border border-primary/10"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const newAddresses = currentUser.addresses.filter((_, i) => i !== idx);
                                if (addr.isDefault && newAddresses.length > 0) {
                                  newAddresses[0].isDefault = true;
                                }
                                setCurrentUser({ ...currentUser, addresses: newAddresses });
                              }}
                              className="p-2 rounded-xl text-text-muted hover:text-status-unavailable hover:bg-status-unavailable/10 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="relative group/field">
                            <textarea
                              value={addr.address || ''}
                              onChange={(e) => {
                                const newAddresses = [...currentUser.addresses];
                                newAddresses[idx].address = e.target.value;
                                setCurrentUser({ ...currentUser, addresses: newAddresses });
                              }}
                              className="w-full px-4 py-3 bg-background-card rounded-2xl border border-border-main focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-bold resize-none h-20 placeholder:text-text-muted/30"
                              placeholder="House No, Building, Street Name..."
                            />
                            <div className="absolute right-3 bottom-3 text-text-muted/20">
                              <MapPin size={14} />
                            </div>
                          </div>

                          <div className="relative group/field">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none opacity-50 group-focus-within/field:opacity-100 transition-opacity">
                              <ExternalLink size={14} />
                            </div>
                            <input
                              type="text"
                              value={addr.location || ''}
                              onChange={(e) => {
                                const newAddresses = [...currentUser.addresses];
                                newAddresses[idx].location = e.target.value;
                                setCurrentUser({ ...currentUser, addresses: newAddresses });
                              }}
                              className="w-full pl-10 pr-4 py-3 bg-background-card rounded-xl border border-border-main focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-xs font-bold placeholder:text-text-muted/30"
                              placeholder="Paste Google Maps Share Link"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!currentUser.addresses || currentUser.addresses.length === 0) && (
                      <div className="text-center py-12 bg-background-muted/20 rounded-[2rem] border-2 border-dashed border-border-light animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-background-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border-light">
                          <MapPin size={24} className="text-text-muted/30" />
                        </div>
                        <p className="text-[11px] text-text-muted font-black uppercase tracking-widest">No Addresses Saved</p>
                        <p className="text-[9px] text-text-muted/50 mt-1">Add a delivery location to get started</p>
                      </div>
                    )}
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
                {isEditing ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
