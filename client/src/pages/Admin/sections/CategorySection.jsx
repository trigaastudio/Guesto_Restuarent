import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Search, Loader2, ArrowUpDown, Filter, Image as ImageIcon, RotateCcw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../../api/axiosInstance';
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:5000`;
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import Swal from 'sweetalert2';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Pagination from '../../../components/Pagination/Pagination';

const CategorySection = ({ refreshKey }) => {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', isActive: true, image: '', discountPercentage: 0, isSharedStock: false, totalStock: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [discountValue, setDiscountValue] = useState('');
  const socketRef = useRef();

  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  useEffect(() => {
    fetchCategories();

    socketRef.current = io(SOCKET_URL);
    socketRef.current.on('categoryUpdate', () => {
      fetchCategories(true);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (refreshKey) {
      fetchCategories(true);
    }
  }, [refreshKey]);

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchCategories = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory({
        _id: category._id,
        name: category.name || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        image: category.image || '',
        discountPercentage: category.discountPercentage || 0,
        isSharedStock: category.isSharedStock || false,
        totalStock: category.totalStock || 0
      });
      setIsEditing(true);
    } else {
      setCurrentCategory({ name: '', isActive: true, image: '', discountPercentage: 0, isSharedStock: false, totalStock: 0 });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    const formData = new FormData();
    formData.append('image', croppedFile);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCurrentCategory({ ...currentCategory, image: response.data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMsg = error.message || 'Failed to upload image.';

      if (errorMsg.includes('File too large')) {
        showAlert({
          icon: 'error',
          title: 'File Too Large',
          text: 'The image size exceeds the 3MB limit. Please upload a smaller file.',
        });
      } else {
        showAlert({
          icon: 'error',
          title: 'Upload Error',
          text: errorMsg,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    const nameRegex = /^[a-zA-Z0-9\s]*$/;

    if (!currentCategory.name || !currentCategory.name.trim()) {
      newErrors.name = 'Category Name is required';
    } else if (!nameRegex.test(currentCategory.name)) {
      newErrors.name = 'Only letters and numbers are allowed';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        if (newErrors.name && nameRef.current) nameRef.current.focus();
      }, 0);
      showToast('warning', 'Please fix the errors');
      return;
    }
    setErrors({});

    try {
      if (isEditing) {
        await api.put(`/api/categories/${currentCategory._id}`, currentCategory);
      } else {
        await api.post('/api/categories', currentCategory);
      }
      fetchCategories(true);
      setIsModalOpen(false);
      showToast('success', `Category ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving category:', error);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: 'Failed to save category. Please try again.'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirmation('Delete Category?', 'Are you sure you want to delete this category?');

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/categories/${id}`);
        fetchCategories(true);
        showToast('success', 'Category deleted successfully');
      } catch (error) {
        console.error('Error deleting category:', error);
        showToast('error', 'Failed to delete category');
      }
    }
  };

  const handleToggleStatus = async (category) => {
    try {

      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, isActive: !c.isActive } : c));
      const updatedCategory = { ...category, isActive: !category.isActive };
      await api.put(`/api/categories/${category._id}`, updatedCategory);
      showToast('success', `Category marked as ${updatedCategory.isActive ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error('Error toggling category status:', error);
      showToast('error', 'Failed to update category status');
      fetchCategories(true);
    }
  };

  const handleSaveDiscount = async (category) => {
    if (discountValue === '' || isNaN(discountValue)) {
      setEditingDiscountId(null);
      return;
    }
    const numValue = Math.min(100, Math.max(0, Number(discountValue)));
    try {
      // Optimistic update
      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, discountPercentage: numValue } : c));
      await api.put(`/api/categories/${category._id}`, { ...category, discountPercentage: numValue });
      showToast('success', 'Discount updated successfully');
    } catch (error) {
      console.error('Error updating discount:', error);
      showToast('error', 'Failed to update discount');
      fetchCategories(true);
    } finally {
      setEditingDiscountId(null);
    }
  };

  const handleRemoveDiscount = async (category) => {
    try {
      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, discountPercentage: 0 } : c));
      await api.put(`/api/categories/${category._id}`, { ...category, discountPercentage: 0 });
      showToast('success', 'Discount removed successfully');
    } catch (error) {
      console.error('Error removing discount:', error);
      showToast('error', 'Failed to remove discount');
      fetchCategories(true);
    }
  };

  const handleUpdateStock = async (category) => {
    const { value: amount } = await Swal.fire({
      title: 'Update Stock',
      input: 'number',
      inputLabel: `Set total stock for ${category.name}`,
      inputPlaceholder: `Current: ${category.totalStock || 0}`,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: 'var(--color-primary)',
      background: 'var(--color-background-card)',
      color: 'var(--color-text-primary)',
      inputValidator: (value) => {
        if (value === '' || value === null || value === undefined || parseInt(value) < 0) {
          return 'Please enter a valid amount (0 or more)';
        }
      }
    });

    if (amount) {
      const newStock = parseInt(amount);
      const isStockActive = newStock > 0;
      try {
        setCategories(prev => prev.map(c => c._id === category._id ? { ...c, totalStock: newStock, stockactive: isStockActive } : c));
        await api.put(`/api/categories/${category._id}`, { ...category, totalStock: newStock, stockactive: isStockActive });
        showToast('success', `Stock for ${category.name} updated to ${newStock}`);
      } catch (error) {
        console.error('Error updating stock:', error);
        showToast('error', 'Failed to update stock');
        fetchCategories(true);
      }
    }
  };

  const handleDeleteStock = async (category) => {
    try {
      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, totalStock: 0, stockactive: false } : c));
      await api.put(`/api/categories/${category._id}`, { ...category, totalStock: 0, stockactive: false });
      showToast('success', `Stock for ${category.name} reset to 0`);
    } catch (error) {
      console.error('Error resetting stock:', error);
      showToast('error', 'Failed to reset stock');
      fetchCategories(true);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    const sorted = [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  };

  const filteredCategories = getSortedData(categories).filter(c => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
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
          <h2 className="text-2xl font-bold text-text-primary">Categories</h2>
          <p className="text-text-secondary text-sm">Manage your menu categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary/50 transition-all outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="all" className="bg-background-card text-text-primary">All Status</option>
              <option value="active" className="bg-background-card text-text-primary">Active</option>
              <option value="inactive" className="bg-background-card text-text-primary">Inactive</option>
            </select>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              disabled={!searchTerm && statusFilter === 'all'}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${!searchTerm && statusFilter === 'all'
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
          <table className="w-full text-left text-sm">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-3 py-4 w-16 text-center">S.No</th>
                <th className="px-3 py-4">Image</th>
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'isActive' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-3 py-4">Items</th>
                <th className="px-3 py-4">Discount</th>
                <th className="px-3 py-4">Total Stock</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10">
                    <TableSkeleton columns={7} rows={5} />
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-text-muted italic">No categories found.</p>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-background-muted/30 transition-colors group">
                    <td className="px-3 py-4 text-center font-medium text-text-muted">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-3 py-4">
                      <div className="w-12 h-12 rounded-lg bg-background-muted overflow-hidden border border-border-light flex items-center justify-center">
                        {category.image ? (
                          <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-text-muted" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="font-bold text-text-primary">{category.name}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${category.isActive ? 'bg-status-on/10 text-status-available' : 'bg-status-off/10 text-status-unavailable'
                        }`}>
                        {category.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{category.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-4 font-medium text-text-secondary">{category.itemCount || 0} Items</td>
                    <td className="px-3 py-4" onDoubleClick={() => { setEditingDiscountId(category._id); setDiscountValue(category.discountPercentage || 0); }}>
                      {editingDiscountId === category._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            autoFocus
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveDiscount(category)}
                            onBlur={() => handleSaveDiscount(category)}
                            className="w-16 px-2 py-1 bg-background-card rounded border border-primary focus:outline-none text-xs text-center"
                          />
                          <span className="text-xs text-text-muted">%</span>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group flex items-center space-x-2"
                          onClick={() => { setEditingDiscountId(category._id); setDiscountValue(category.discountPercentage || 0); }}
                          title="Click to edit discount"
                        >
                          {category.discountPercentage > 0 ? (
                            <>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-status-on/10 text-status-available border border-status-on/20 group-hover:bg-status-on/20 transition-colors">
                                {category.discountPercentage}% Off
                              </span>
                              <Trash2
                                size={12}
                                className="opacity-0 group-hover:opacity-100 text-status-unavailable transition-opacity hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDiscount(category);
                                }}
                                title="Remove discount"
                              />
                            </>
                          ) : (
                            <>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background-muted text-text-muted border border-border-main group-hover:border-primary group-hover:text-primary transition-colors">
                                0% Off
                              </span>
                              <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity" />
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center space-x-3">
                        {category.totalStock > 0 ? (
                          <div className="flex items-center justify-center w-full">
                            <span className="font-bold text-text-primary">{category.totalStock}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(category)}
                          className={`p-2 rounded-xl transition-all duration-200 ${category.isActive
                            ? 'text-status-unavailable hover:bg-status-off/10'
                            : 'text-status-available hover:bg-status-on/10'
                            }`}
                          title={category.isActive ? "Deactivate Category" : "Activate Category"}
                        >
                          {category.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="p-2 text-text-secondary hover:text-status-unavailable hover:bg-status-off/10 rounded-lg transition-colors"
                          title="Delete Category"
                        >
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      { }
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background-card w-full max-w-md rounded-2xl border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border-light flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">{isEditing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${errors.name ? 'text-primary' : 'text-text-secondary'}`}>Category Name</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={currentCategory.name}
                  onChange={(e) => {
                    setCurrentCategory({ ...currentCategory, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: false });
                  }}
                  className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all ${errors.name
                      ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
                      : 'border-border-main focus:border-primary'
                    }`}
                  placeholder="e.g. Main Course"
                />
                {errors.name && <p className="text-[10px] font-bold text-primary mt-1">{typeof errors.name === 'string' ? errors.name : 'Category Name is required'}</p>}
              </div>
              {!isEditing && (
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-text-secondary">Status</label>
                  <button
                    onClick={() => setCurrentCategory({ ...currentCategory, isActive: !currentCategory.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentCategory.isActive ? 'bg-primary' : 'bg-text-muted'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentCategory.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                  <span className="text-sm text-text-primary font-medium">
                    {currentCategory.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-text-secondary">Category Image</label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-background-muted border-2 border-dashed border-border-main flex items-center justify-center overflow-hidden shrink-0">
                    {currentCategory.image ? (
                      <img src={currentCategory.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className={`
                      flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border border-primary text-primary text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white transition-all
                      ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                      <ImageIcon size={14} />
                      <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <input
                      type="text"
                      value={currentCategory.image}
                      onChange={(e) => setCurrentCategory({ ...currentCategory, image: e.target.value })}
                      className="w-full px-3 py-1.5 bg-background-muted/50 rounded-lg border border-border-main focus:border-primary outline-none text-[10px]"
                      placeholder="Or paste image URL"
                    />
                  </div>
                </div>
              </div>


            </div>
            <div className="p-6 bg-background-muted/30 border-t border-border-light flex space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border-main text-text-primary rounded-xl font-semibold hover:bg-background-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light shadow-lg shadow-primary/20 transition-all"
              >
                {isEditing ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCropper && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspect={1}
        />
      )}
    </div>
  );
};

export default CategorySection;
