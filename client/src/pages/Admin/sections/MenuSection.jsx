import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Filter, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowUpDown, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';

const API_BASE_URL = 'http://localhost:5000/api';

const MenuSection = () => {
  const [menus, setMenus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const [currentMenu, setCurrentMenu] = useState({
    name: '',
    category: '',
    description: '',
    offerPrice: 0,
    hasOffer: false,
    variants: [],
    image: '',
    foodType: 'veg',
    totalStock: 0,
    isBlocked: false
  });

  const [allSizes, setAllSizes] = useState([]);

  const [isUploading, setIsUploading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Crop State
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [menuRes, catRes, sizeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/menu`),
        axios.get(`${API_BASE_URL}/categories`),
        axios.get(`${API_BASE_URL}/sizes`)
      ]);
      setMenus(menuRes.data);
      setCategories(catRes.data.filter(c => c.isActive));
      setAllSizes(sizeRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (menu = null) => {
    if (menu) {
      setCurrentMenu({
        ...menu,
        category: menu.category?._id || menu.category,
        variants: menu.variants?.map(v => ({
          size: v.size?._id || v.size,
          price: v.price
        })) || []
      });
      setIsEditing(true);
    } else {
      setCurrentMenu({
        name: '',
        category: '',
        description: '',
        offerPrice: 0,
        hasOffer: false,
        variants: [],
        image: '',
        foodType: 'veg',
        totalStock: 0,
        isBlocked: false
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentMenu.name || !currentMenu.category) {
      showToast('warning', 'Name and Category are required');
      return;
    }

    if (currentMenu.variants.length === 0) {
      showToast('warning', 'At least one size variant is required');
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/menu/${currentMenu._id}`, currentMenu);
      } else {
        await axios.post(`${API_BASE_URL}/menu`, currentMenu);
      }
      fetchData();
      setIsModalOpen(false);
      showToast('success', `Menu item ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving menu item:', error);
      showAlert({
        icon: 'error',
        title: 'Save Failed',
        text: error.response?.data?.message || 'Failed to save menu item.'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirmation('Delete Menu Item?', 'Are you sure you want to delete this menu item?');
    
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/menu/${id}`);
        fetchData();
        showToast('success', 'Menu item deleted successfully');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('error', 'Failed to delete menu item');
      }
    }
  };

  const handleAddSize = () => {
    setCurrentMenu({
      ...currentMenu,
      variants: [...currentMenu.variants, { size: '', price: 0 }]
    });
  };

  const handleRemoveSize = (index) => {
    const newVariants = [...currentMenu.variants];
    newVariants.splice(index, 1);
    setCurrentMenu({ ...currentMenu, variants: newVariants });
  };

  const handleSizeChange = (index, field, value) => {
    const newVariants = [...currentMenu.variants];
    newVariants[index][field] = field === 'price' ? (value === '' ? '' : parseFloat(value)) : value;
    setCurrentMenu({ ...currentMenu, variants: newVariants });
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
      // Replace with your actual API base URL if different
      const response = await fetch('http://localhost:5000/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setCurrentMenu({ ...currentMenu, image: data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMsg = error.message || 'Failed to upload image.';
      
      if (errorMsg.includes('File too large')) {
        showAlert({
          icon: 'error',
          title: 'File Too Large',
          text: 'The image size exceeds the 2MB limit. Please upload a smaller file.',
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    const sorted = [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'category') {
        valA = a.category?.name || '';
        valB = b.category?.name || '';
      } else if (sortConfig.key === 'price') {
        valA = a.variants?.[0]?.price || 0;
        valB = b.variants?.[0]?.price || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Filter menu items based on search and selected filters
  const filteredMenus = getSortedData(menus).filter(m => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (m.name || '').toLowerCase().includes(searchLower) ||
                         (m.category?.name || '').toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'all' || m.category?._id === categoryFilter;
    const matchesType = typeFilter === 'all' || m.foodType === typeFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'available' ? m.totalStock > 0 : m.totalStock === 0);
    
    return matchesSearch && matchesCategory && matchesType && matchesStock;
  });

  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    if (menus.length > 0) {
      const initialSizes = {};
      menus.forEach(menu => {
        if (menu.variants?.length > 0) {
          initialSizes[menu._id] = menu.variants[0].size?._id || menu.variants[0].size;
        }
      });
      setSelectedSizes(initialSizes);
    }
  }, [menus]);

  const handleRowSizeChange = (menuId, sizeId) => {
    setSelectedSizes(prev => ({ ...prev, [menuId]: sizeId }));
  };

  const getCalculatedStock = (menu) => {
    const selectedSizeId = selectedSizes[menu._id];
    if (!selectedSizeId) return menu.totalStock || 0;

    const variant = menu.variants?.find(v => (v.size?._id || v.size) === selectedSizeId);
    if (!variant || !variant.size) return menu.totalStock || 0;

    // Use the multiplier value from the size object
    const multiplier = variant.size.value || 1;
    return Math.floor((menu.totalStock || 0) / multiplier);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Menu Items</h2>
          <p className="text-text-secondary text-sm">Manage your restaurant menu</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search items or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary/50 transition-all outline-none text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 bg-background-card border border-border-main rounded-lg px-2 py-1">
                <Filter size={14} className="text-text-muted" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background-card text-text-primary text-xs outline-none py-1 cursor-pointer"
                >
                  <option value="all" className="bg-background-card text-text-primary">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id} className="bg-background-card text-text-primary">{cat.name}</option>
                  ))}
                </select>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
              >
                <option value="all" className="bg-background-card text-text-primary">All Types</option>
                <option value="veg" className="bg-background-card text-text-primary">Veg</option>
                <option value="non-veg" className="bg-background-card text-text-primary">Non-Veg</option>
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
              >
                <option value="all" className="bg-background-card text-text-primary">All Stock</option>
                <option value="available" className="bg-background-card text-text-primary">Available</option>
                <option value="out-of-stock" className="bg-background-card text-text-primary">Out of Stock</option>
              </select>
              <button
                onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setTypeFilter('all'); setStockFilter('all'); }}
                disabled={!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && stockFilter === 'all'}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${
                  !searchTerm && categoryFilter === 'all' && typeFilter === 'all' && stockFilter === 'all'
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-4 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group min-w-[200px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Menu Item</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('category')}>
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'category' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Type</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors group min-w-[120px]" onClick={() => handleSort('price')}>
                  <div className="flex items-center space-x-1">
                    <span>Pricing</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'price' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Inventory</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-text-secondary font-medium">Loading menu items...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-text-muted italic">No menu items found.</p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu, index) => (
                  <tr key={menu._id} className="hover:bg-background-muted/30 transition-colors group align-middle">
                    <td className="px-4 py-4 text-center font-medium text-text-muted">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-background-muted overflow-hidden shrink-0 border border-border-light shadow-sm">
                          {menu.image ? (
                            <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-text-primary leading-tight">{menu.name}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1 max-w-[180px]">{menu.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold text-text-secondary bg-background-muted/50 px-2.5 py-1 rounded-full border border-border-light">
                        {menu.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          menu.foodType === 'veg' 
                            ? 'bg-status-on/5 text-status-available border-status-on/20' 
                            : 'bg-status-off/5 text-status-unavailable border-status-off/20'
                        }`}>
                          {menu.foodType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        {menu.variants?.length > 0 ? (
                          <div className="relative">
                            <select
                              value={selectedSizes[menu._id] || ''}
                              onChange={(e) => handleRowSizeChange(menu._id, e.target.value)}
                              className="w-full bg-background-muted/50 border border-border-light rounded-lg px-2 py-1 text-[11px] font-bold text-text-primary outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                              {menu.variants.map((v, idx) => (
                                <option key={idx} value={v.size?._id || v.size}>
                                  {v.size?.name || 'Size'}: ₹{v.price}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">No variants</span>
                        )}
                        
                        {menu.hasOffer && (
                          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-status-on/5 border border-status-on/10 rounded-md w-fit">
                            <span className="text-[9px] text-status-available font-bold uppercase">Offer:</span>
                            <span className="text-[11px] text-status-available font-black">₹{menu.offerPrice}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        {menu.totalStock > 0 ? (
                          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <span className="text-sm font-black text-text-primary">
                              {getCalculatedStock(menu)}
                            </span>
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">
                              {menu.variants?.find(v => (v.size?._id || v.size) === selectedSizes[menu._id])?.size?.name || 'Units'} Available
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-status-unavailable uppercase bg-status-off/10 px-2 py-1 rounded border border-status-off/20">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          !menu.isBlocked 
                            ? 'bg-status-on/10 text-status-available border-status-on/30' 
                            : 'bg-status-off/10 text-status-unavailable border-status-off/30'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${!menu.isBlocked ? 'bg-status-available animate-pulse' : 'bg-status-unavailable'}`} />
                          <span>{!menu.isBlocked ? 'Live' : 'Hidden'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => handleOpenModal(menu)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(menu._id)}
                          className="p-2 text-text-secondary hover:text-status-unavailable hover:bg-status-off/10 rounded-xl transition-all duration-200"
                          title="Delete Item"
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
      </div>

      {/* Large Modal for Menu Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-background-card w-full max-w-2xl rounded-2xl border border-border-light shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-border-light flex items-center justify-between sticky top-0 bg-background-card z-10">
              <h3 className="text-xl font-bold text-text-primary">{isEditing ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Item Name</label>
                  <input
                    type="text"
                    value={currentMenu.name}
                    onChange={(e) => setCurrentMenu({...currentMenu, name: e.target.value})}
                    className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                    placeholder="e.g. Chicken Biryani"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Category</label>
                  <select
                    value={currentMenu.category}
                    onChange={(e) => setCurrentMenu({...currentMenu, category: e.target.value})}
                    className="w-full px-4 py-2 bg-background-muted/50 text-text-primary rounded-xl border border-border-main focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="" className="bg-background-card text-text-primary">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id} className="bg-background-card text-text-primary">{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary">Description</label>
                <textarea
                  value={currentMenu.description}
                  onChange={(e) => setCurrentMenu({...currentMenu, description: e.target.value})}
                  className="w-full px-4 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all h-20 resize-none"
                  placeholder="Describe the dish..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-text-secondary">Food Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="foodType" 
                        value="veg" 
                        checked={currentMenu.foodType === 'veg'} 
                        onChange={(e) => setCurrentMenu({...currentMenu, foodType: e.target.value})}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">Veg</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="foodType" 
                        value="non-veg" 
                        checked={currentMenu.foodType === 'non-veg'} 
                        onChange={(e) => setCurrentMenu({...currentMenu, foodType: e.target.value})}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text-primary">Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-background-muted/30 p-4 rounded-2xl border border-border-light space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-text-secondary">Total Stock</label>
                  {currentMenu.variants?.[0]?.size && (
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      In {allSizes.find(s => s._id === currentMenu.variants[0].size)?.unit || 'Base Units'}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={currentMenu.totalStock === 0 ? '' : currentMenu.totalStock}
                  onChange={(e) => setCurrentMenu({...currentMenu, totalStock: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-background-card rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm"
                  placeholder="Total base units (e.g. total pieces)"
                />
                <p className="text-[10px] text-text-muted italic">* Stock is tracked in base units (e.g. pieces)</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-text-secondary">Size Variants & Pricing</label>
                  <button 
                    onClick={handleAddSize}
                    className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                  >
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {currentMenu.variants.map((variant, index) => (
                    <div key={index} className="flex items-center space-x-3 group/size bg-background-muted/30 p-3 rounded-xl border border-border-light">
                      <div className="flex-1">
                        <select
                          value={variant.size}
                          onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                          className="w-full px-3 py-1.5 bg-background-card rounded-lg border border-border-main focus:border-primary outline-none transition-all text-sm"
                        >
                          <option value="">Select Size</option>
                          {allSizes.filter(s => s.isActive || s._id === variant.size).map(s => (
                            <option key={s._id} value={s._id}>{s.name} ({s.value} {s.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="Price"
                          value={variant.price === 0 ? '' : variant.price}
                          onChange={(e) => handleSizeChange(index, 'price', e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 bg-background-card rounded-lg border border-border-main text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <button 
                        onClick={() => handleRemoveSize(index)}
                        className="p-1.5 text-text-muted hover:text-status-unavailable hover:bg-status-off/10 rounded-md transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {currentMenu.variants.length === 0 && (
                    <p className="text-xs text-text-muted italic text-center py-4 bg-background-muted/30 rounded-xl border border-dashed border-border-light">
                      No variants added. Click "Add Variant" to set sizes and prices.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <div className="flex items-center space-x-3">
                    <label className="text-sm font-semibold text-text-secondary">Has Offer?</label>
                    <button
                      onClick={() => setCurrentMenu({...currentMenu, hasOffer: !currentMenu.hasOffer})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        currentMenu.hasOffer ? 'bg-primary' : 'bg-text-muted'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentMenu.hasOffer ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  {currentMenu.hasOffer && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="Offer Price"
                        value={currentMenu.offerPrice === 0 ? '' : currentMenu.offerPrice}
                        onChange={(e) => setCurrentMenu({...currentMenu, offerPrice: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                        className="w-full pl-7 pr-3 py-2 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-semibold text-text-secondary">Block Item?</label>
                    <button
                      onClick={() => setCurrentMenu({...currentMenu, isBlocked: !currentMenu.isBlocked})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        currentMenu.isBlocked ? 'bg-status-off' : 'bg-text-muted'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentMenu.isBlocked ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs text-text-muted">Temporarily hide from menu</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-text-secondary">Item Image</label>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 rounded-xl bg-background-muted border-2 border-dashed border-border-main flex items-center justify-center overflow-hidden shrink-0">
                      {currentMenu.image ? (
                        <img src={currentMenu.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className={`
                        flex items-center justify-center space-x-2 px-4 py-2 rounded-xl border border-primary text-primary font-semibold cursor-pointer hover:bg-primary hover:text-white transition-all
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}>
                        <ImageIcon size={18} />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-[10px] text-text-muted">Recommended: Square image, max 2MB (JPG, PNG, WebP)</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Or Paste Image URL</label>
                    <input
                      type="text"
                      value={currentMenu.image}
                      onChange={(e) => setCurrentMenu({...currentMenu, image: e.target.value})}
                      className="w-full px-4 py-1.5 bg-background-muted/50 rounded-xl border border-border-main focus:border-primary outline-none transition-all text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-background-muted/30 border-t border-border-light flex space-x-3 sticky bottom-0 bg-background-card z-10">
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
                {isEditing ? 'Save Changes' : 'Create Item'}
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

export default MenuSection;
