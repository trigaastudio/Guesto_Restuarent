import React, { Fragment, useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Filter, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowUpDown, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import api from '../../../api/axiosInstance';
import { showAlert, showToast, showDeleteConfirmation } from '../../../utils/sweetAlert';
import ImageCropper from '../../../components/ImageCropper/ImageCropper';
import TableSkeleton from '../../../components/Skeleton/TableSkeleton';
import Pagination from '../../../components/Pagination/Pagination';

const STANDARD_VARIANTS = ['Piece', 'Quarter', 'Half', 'Full'];

const MenuSection = () => {
  const [menus, setMenus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(localStorage.getItem('menuSearchTerm') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

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
    isBlocked: false,
    isCombo: false,
    comboItems: [],
    offerPercentage: 0,
    discountPercentage: 0,
    includedItems: [] 
  });


  const [isUploading, setIsUploading] = useState(false);

  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [discountValue, setDiscountValue] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Crop State
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const stockRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector('main .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get('/api/menus?all=true'),
        api.get('/api/categories')
      ]);
      setMenus(menuRes.data);
      setCategories(catRes.data.filter(c => c.isActive));
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
        isBlocked: menu.isBlocked || false,
        isCombo: menu.isCombo || false,
        comboItems: menu.comboItems?.map(ci => ({
          menuItem: ci.menuItem?._id || ci.menuItem,
          price: ci.price || 0
        })) || [],
        offerPercentage: menu.offerPercentage || 0,
        discountPercentage: menu.discountPercentage || 0,
        variants: menu.variants?.map(v => ({
          size: v.size,
          price: v.price,
          costPrice: v.costPrice || 0,
          stockValue: v.stockValue || 1,
          isBOGO: v.isBOGO || false,
          bogoItem: v.bogoItem?._id || v.bogoItem || '',
          bogoVariant: v.bogoVariant || '',
          includedItems: v.includedItems?.map(inc => ({
            menuItem: inc.menuItem?._id || inc.menuItem,
            quantity: inc.quantity
          })) || []
        })) || [],
        price: menu.price || 0
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
        isBlocked: false,
        isCombo: false,
        comboItems: [],
        offerPercentage: 0,
        discountPercentage: 0,
        price: ''
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleAddIncludedItem = (variantIndex) => {
    const newVariants = [...currentMenu.variants];
    if (!newVariants[variantIndex].includedItems) {
      newVariants[variantIndex].includedItems = [];
    }
    newVariants[variantIndex].includedItems.push({ menuItem: '', quantity: 1 });
    setCurrentMenu({ ...currentMenu, variants: newVariants });
  };

  const handleRemoveIncludedItem = (variantIndex, itemIndex) => {
    const newVariants = [...currentMenu.variants];
    newVariants[variantIndex].includedItems.splice(itemIndex, 1);
    setCurrentMenu({ ...currentMenu, variants: newVariants });
  };

  const handleIncludedItemChange = (variantIndex, itemIndex, field, value) => {
    const newVariants = [...currentMenu.variants];
    newVariants[variantIndex].includedItems[itemIndex][field] = field === 'quantity' ? (value === '' ? '' : parseInt(value)) : value;
    setCurrentMenu({ ...currentMenu, variants: newVariants });
  };

  const handleSave = async () => {
    const isComboCategory = categories.find(c => c._id === currentMenu.category)?.name.toLowerCase() === 'combo';
    
    const newErrors = {};
    const textRegex = /^[a-zA-Z0-9\s]*$/;
    
    if (!currentMenu.name || !currentMenu.name.trim()) {
      newErrors.name = 'Item Name is required';
    } else if (currentMenu.name.length > 20) {
      newErrors.name = 'Maximum length is 20 characters';
    } else if (!textRegex.test(currentMenu.name)) {
      newErrors.name = 'Only alphabets and numbers are allowed';
    }

    if (!currentMenu.category) newErrors.category = true;
    
    if (currentMenu.totalStock === '' || currentMenu.totalStock === undefined || currentMenu.totalStock === null) {
      newErrors.totalStock = 'Stock is required';
    } else if (currentMenu.totalStock < 0) {
      newErrors.totalStock = 'Stock must be a positive value';
    }

    if (currentMenu.description) {
      if (currentMenu.description.length > 50) {
        newErrors.description = 'Maximum length is 50 characters';
      } else if (!textRegex.test(currentMenu.description)) {
        newErrors.description = 'Special characters are not allowed';
      }
    }
    
    if (!isComboCategory && currentMenu.variants.length === 0) newErrors.variants = true;
    if (isComboCategory && currentMenu.comboItems.length === 0) newErrors.variants = true; 
    if (!currentMenu.image) newErrors.image = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        if (newErrors.name && nameRef.current) nameRef.current.focus();
        else if (newErrors.category && categoryRef.current) categoryRef.current.focus();
        else if (newErrors.totalStock && stockRef.current) stockRef.current.focus();
        else if (newErrors.description && descriptionRef.current) descriptionRef.current.focus();
      }, 0);
      return;
    }
    setErrors({});

    const comboTotalPrice = isComboCategory
      ? currentMenu.comboItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) * (1 - (currentMenu.offerPercentage || 0) / 100)
      : 0;

    const cleanedVariants = currentMenu.variants.map(v => ({
      ...v,
      bogoItem: v.bogoItem === '' ? null : v.bogoItem,
      includedItems: (v.includedItems || []).filter(inc => inc.menuItem !== '')
    }));

    const finalPrice = isComboCategory
      ? comboTotalPrice
      : (currentMenu.variants.length > 0 ? (currentMenu.variants[0]?.price || 0) : (currentMenu.price || 0));

    const payload = {
      ...currentMenu,
      isCombo: isComboCategory,
      price: finalPrice,
      variants: isComboCategory ? [] : cleanedVariants
    };

    try {
      if (isEditing) {
        await api.put(`/api/menus/${currentMenu._id}`, payload);
      } else {
        await api.post('/api/menus', payload);
      }
      fetchData(true);
      setIsModalOpen(false);
      showToast('success', `Item ${isEditing ? 'updated' : 'created'} successfully!`);
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
        await api.delete(`/api/menus/${id}`);
        fetchData(true);
        showToast('success', 'Item deleted successfully');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('error', 'Failed to delete menu item');
      }
    }
  };

  const handleToggleStatus = async (menu) => {
    try {
      const updatedMenu = { ...menu, isBlocked: !menu.isBlocked };
      
      setMenus(prev => prev.map(m => m._id === menu._id ? { ...m, isBlocked: !m.isBlocked } : m));
      await api.put(`/api/menus/${menu._id}`, updatedMenu);
      showToast('success', `Item ${updatedMenu.isBlocked ? 'blocked' : 'unblocked'} successfully`);
    } catch (error) {
      console.error('Error toggling menu status:', error);
      showToast('error', 'Failed to update menu status');
      fetchData(true); 
    }
  };

  const handleSaveDiscount = async (menu) => {
    if (discountValue === '' || isNaN(discountValue)) {
      setEditingDiscountId(null);
      return;
    }
    const numValue = Math.min(100, Math.max(0, Number(discountValue)));
    try {
      // Optimistic update
      setMenus(prev => prev.map(m => m._id === menu._id ? { ...m, discountPercentage: numValue } : m));
      await api.put(`/api/menus/${menu._id}`, { discountPercentage: numValue });
      showToast('success', 'Discount updated successfully');
    } catch (error) {
      console.error('Error updating discount:', error);
      showToast('error', 'Failed to update discount');
      fetchData(true); 
    } finally {
      setEditingDiscountId(null);
    }
  };

  const handleAddSize = () => {
    setCurrentMenu({
      ...currentMenu,
      variants: [...currentMenu.variants, { size: '', price: 0, costPrice: 0, stockValue: 1, isBOGO: false, bogoItem: '', bogoVariant: '', includedItems: [] }]
    });
  };

  const handleRemoveSize = (index) => {
    const newVariants = [...currentMenu.variants];
    newVariants.splice(index, 1);
    setCurrentMenu({ ...currentMenu, variants: newVariants });
  };

  const handleSizeChange = (index, field, value) => {
    const newVariants = [...currentMenu.variants];
    newVariants[index][field] = (field === 'price' || field === 'stockValue' || field === 'costPrice') ? (value === '' ? '' : parseFloat(value)) : value;
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
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const response = await api.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCurrentMenu({ ...currentMenu, image: response.data.url });
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
        valA = a.price || 0;
        valB = b.price || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  
  const filteredMenus = getSortedData(menus).filter(m => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = (m.name || '').toLowerCase().includes(searchLower) ||
      (m.category?.name || '').toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'all' || m.category?._id === categoryFilter;
    const matchesType = typeFilter === 'all' || m.foodType === typeFilter;
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'available' ? m.totalStock > 0 :
        stockFilter === 'low-stock' ? (m.totalStock > 0 && m.totalStock <= 10) :
          m.totalStock === 0);

    return matchesSearch && matchesCategory && matchesType && matchesStock;
  });

  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const paginatedMenus = filteredMenus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, typeFilter, stockFilter]);

  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    if (menus.length > 0) {
      const initialSizes = {};
      menus.forEach(menu => {
        if (menu.variants?.length > 0) {
          initialSizes[menu._id] = menu.variants[0].size;
        }
      });
      setSelectedSizes(initialSizes);
    }
  }, [menus]);

  const handleRowSizeChange = (menuId, sizeId) => {
    setSelectedSizes(prev => ({ ...prev, [menuId]: sizeId }));
  };

  const getCalculatedStock = (menu) => {
    if (menu.category?.stockactive) {
      return menu.category.totalStock || 0;
    }

    const baseStock = menu.totalStock || 0;

    const selectedSizeId = selectedSizes[menu._id];
    if (!selectedSizeId) return baseStock;

    const variant = menu.variants?.find(v => v.size === selectedSizeId);
    if (!variant) return baseStock;

    const multiplier = variant.stockValue || 1;
    return Math.floor(baseStock / multiplier);
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  localStorage.setItem('menuSearchTerm', e.target.value);
                }}
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
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-background-card text-text-primary border border-border-main rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
              >
                <option value="all" className="bg-background-card text-text-primary">All Stock</option>
                <option value="available" className="bg-background-card text-text-primary">Available</option>
                <option value="low-stock" className="bg-background-card text-text-primary">Low Stock</option>
                <option value="out-of-stock" className="bg-background-card text-text-primary">Out of Stock</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  localStorage.removeItem('menuSearchTerm');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setStockFilter('all');
                }}
                disabled={!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && stockFilter === 'all'}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${!searchTerm && categoryFilter === 'all' && typeFilter === 'all' && stockFilter === 'all'
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
                <th className="px-2 py-4 w-12 text-center">#</th>
                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors group min-w-[200px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Menu Item</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>


                <th className="px-3 py-4 cursor-pointer hover:text-primary transition-colors group min-w-[120px]" onClick={() => handleSort('price')}>
                  <div className="flex items-center space-x-1">
                    <span>Pricing</span>
                    <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'price' ? 'opacity-100 text-primary' : ''}`} />
                  </div>
                </th>
                <th className="px-3 py-4 text-center">Discount</th>
                <th className="px-3 py-4 text-center">Inventory</th>
                <th className="px-3 py-4 text-center">Status</th>
                <th className="px-3 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10">
                    <TableSkeleton columns={8} rows={5} />
                  </td>
                </tr>
              ) : paginatedMenus.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <p className="text-text-muted italic">No menu items found.</p>
                  </td>
                </tr>
              ) : (
                paginatedMenus.map((menu, index) => (
                  <tr key={menu._id} className="hover:bg-background-muted/30 transition-colors group align-middle">
                    <td className="px-2 py-4 text-center font-medium text-text-muted">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-3 py-4">
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
                        <div className="flex flex-col justify-center">
                          <p className="font-bold text-text-primary text-sm leading-tight">{menu.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-col space-y-2">
                        {menu.isCombo ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-primary">₹{menu.price?.toFixed(0)}</span>
                            <span className="text-[9px] text-text-muted font-bold uppercase">Combo Price</span>
                            {menu.offerPercentage > 0 && (
                              <span className="text-[9px] text-status-available font-bold italic">({menu.offerPercentage}% Off)</span>
                            )}
                          </div>
                        ) : menu.variants?.length > 0 ? (
                          <div className="relative">
                            <select
                              value={selectedSizes[menu._id] || ''}
                              onChange={(e) => handleRowSizeChange(menu._id, e.target.value)}
                              className="w-full bg-background-muted/50 border border-border-light rounded-lg px-2 py-1 text-[11px] font-bold text-text-primary outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                              {menu.variants.map((v, idx) => (
                                <option key={idx} value={v.size}>
                                  {v.size}: ₹{v.price}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">No variants</span>
                        )}

                        {menu.hasOffer && !menu.isCombo && (
                          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-status-on/5 border border-status-on/10 rounded-md w-fit">
                            <span className="text-[9px] text-status-available font-bold uppercase">Offer:</span>
                            <span className="text-[11px] text-status-available font-black">₹{menu.offerPrice}</span>
                          </div>
                        )}

                        {(() => {
                          const selectedSizeId = selectedSizes[menu._id];
                          const variant = menu.variants?.find(v => v.size === selectedSizeId);
                          if (variant?.isBOGO && variant?.bogoItem) {
                            return (
                              <div className="flex flex-col space-y-0.5 mt-1 bg-status-on/5 border border-status-on/20 rounded-lg p-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                <span className="text-[8px] font-black text-status-available uppercase tracking-widest">BOGO active</span>
                                <div className="flex items-center space-x-1 text-[10px] font-bold text-text-primary">
                                  <span className="text-status-available">free:</span>
                                  <span className="truncate max-w-[120px]">{variant.bogoItem.name} {variant.bogoVariant && `(${variant.bogoVariant})`}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center" onDoubleClick={() => { setEditingDiscountId(menu._id); setDiscountValue(menu.discountPercentage || 0); }}>
                      {editingDiscountId === menu._id ? (
                        <div className="flex justify-center items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            autoFocus
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveDiscount(menu)}
                            onBlur={() => handleSaveDiscount(menu)}
                            className="w-16 px-2 py-1 bg-background-card rounded border border-primary focus:outline-none text-xs text-center"
                          />
                          <span className="text-xs text-text-muted">%</span>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group flex justify-center items-center space-x-2"
                          onClick={() => { setEditingDiscountId(menu._id); setDiscountValue(menu.discountPercentage || 0); }}
                          title="Click to edit discount"
                        >
                          {menu.discountPercentage > 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-status-on/10 text-status-available border border-status-on/20 group-hover:bg-status-on/20 transition-colors">
                              {menu.discountPercentage}% Off
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background-muted text-text-muted border border-border-main group-hover:border-primary group-hover:text-primary transition-colors">
                              0% Off
                            </span>
                          )}
                          {menu.discountPercentage > 0 ? (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  
                                  setMenus(prev => prev.map(m => m._id === menu._id ? { ...m, discountPercentage: 0 } : m));
                                  await api.put(`/api/menus/${menu._id}`, { discountPercentage: 0 });
                                  showToast('success', 'Discount removed');
                                } catch (error) {
                                  console.error('Error removing discount:', error);
                                  showToast('error', 'Failed to remove discount');
                                  fetchData(true); 
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-status-unavailable hover:text-red-600 transition-opacity p-1"
                              title="Remove Discount"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-text-muted transition-opacity" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        {getCalculatedStock(menu) > 0 ? (
                          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <span className={`text-sm font-black ${getCalculatedStock(menu) <= 10 ? 'text-amber-600' : 'text-text-primary'}`}>
                              {getCalculatedStock(menu)}
                            </span>
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter flex flex-col items-center mt-0.5">
                              {menu.category?.stockactive ? (
                                <span className="text-primary font-black bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Category Stock</span>
                              ) : (
                                <span>{menu.variants?.find(v => v.size === selectedSizes[menu._id])?.size || 'Units'} Available</span>
                              )}
                            </span>
                            {getCalculatedStock(menu) <= 10 && (
                              <span className="mt-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase rounded border border-amber-500/20">
                                Low Stock
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-status-unavailable uppercase bg-status-off/10 px-2 py-1 rounded border border-status-off/20">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${!menu.isBlocked
                          ? 'bg-status-on/10 text-status-available border-status-on/30'
                          : 'bg-status-off/10 text-status-unavailable border-status-off/30'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${!menu.isBlocked ? 'bg-status-available animate-pulse' : 'bg-status-unavailable'}`} />
                          <span>{!menu.isBlocked ? 'Live' : 'Hidden'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleToggleStatus(menu)}
                          className={`p-2 rounded-xl transition-all duration-200 ${!menu.isBlocked
                            ? 'text-status-unavailable hover:bg-status-off/10'
                            : 'text-status-available hover:bg-status-on/10'
                            }`}
                          title={!menu.isBlocked ? "Hide from Menu" : "Show in Menu"}
                        >
                          {!menu.isBlocked ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className={`text-sm font-semibold ${errors.name ? 'text-primary' : 'text-text-secondary'}`}>Item Name</label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={currentMenu.name}
                    onChange={(e) => {
                      setCurrentMenu({ ...currentMenu, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: false });
                    }}
                    className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all ${
                      errors.name 
                        ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                        : 'border-border-main focus:border-primary'
                    }`}
                    placeholder="e.g. Chicken Biryani"
                  />
                  {errors.name && <p className="text-[10px] font-bold text-primary mt-1">{typeof errors.name === 'string' ? errors.name : 'Item Name is required'}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={`text-sm font-semibold ${errors.category ? 'text-primary' : 'text-text-secondary'}`}>Category</label>
                  <select
                    ref={categoryRef}
                    value={currentMenu.category}
                    onChange={(e) => {
                      setCurrentMenu({ ...currentMenu, category: e.target.value });
                      if (errors.category) setErrors({ ...errors, category: false });
                    }}
                    className={`w-full px-4 py-2 bg-background-muted/50 text-text-primary rounded-xl border outline-none transition-all cursor-pointer ${
                      errors.category 
                        ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                        : 'border-border-main focus:border-primary'
                    }`}
                  >
                    <option value="" className="bg-background-card text-text-primary">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id} className="bg-background-card text-text-primary">{cat.name}</option>
                    ))}
                  </select>
                </div>
                {!categories.find(c => c._id === currentMenu.category)?.stockactive && (
                  <div className="space-y-1.5">
                    <label className={`text-sm font-semibold ${errors.totalStock ? 'text-primary' : 'text-text-secondary'}`}>Total Stock</label>
                    <input
                      ref={stockRef}
                      type="number"
                      value={currentMenu.totalStock === '' ? '' : currentMenu.totalStock}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentMenu({ ...currentMenu, totalStock: val === '' ? '' : parseInt(val) });
                        if (errors.totalStock) setErrors({ ...errors, totalStock: false });
                      }}
                      className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all ${
                        errors.totalStock 
                          ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                          : 'border-border-main focus:border-primary'
                      }`}
                      placeholder="0"
                    />
                    {errors.totalStock && <p className="text-[10px] font-bold text-primary mt-1">{typeof errors.totalStock === 'string' ? errors.totalStock : 'Stock is required'}</p>}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-text-secondary">Food Type</label>
                  <div className="flex items-center justify-around h-[42px] bg-background-muted/50 px-4 rounded-xl border border-border-main">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="foodType" value="veg" checked={currentMenu.foodType === 'veg'} onChange={() => setCurrentMenu({ ...currentMenu, foodType: 'veg' })} className="accent-green-500 w-4 h-4" />
                      <span className="text-xs font-black text-green-500 uppercase tracking-wider">Veg</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="foodType" value="non-veg" checked={currentMenu.foodType === 'non-veg'} onChange={() => setCurrentMenu({ ...currentMenu, foodType: 'non-veg' })} className="accent-red-500 w-4 h-4" />
                      <span className="text-xs font-black text-red-500 uppercase tracking-wider">Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${errors.description ? 'text-primary' : 'text-text-secondary'}`}>Description</label>
                <textarea
                  ref={descriptionRef}
                  value={currentMenu.description}
                  onChange={(e) => {
                    setCurrentMenu({ ...currentMenu, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: false });
                  }}
                  className={`w-full px-4 py-2 bg-background-muted/50 rounded-xl border outline-none transition-all h-20 resize-none ${
                    errors.description 
                      ? 'border-primary ring-1 ring-primary/30 bg-primary/5' 
                      : 'border-border-main focus:border-primary'
                  }`}
                  placeholder="Describe the dish..."
                />
                {errors.description && <p className="text-[10px] font-bold text-primary mt-1">{errors.description}</p>}
              </div>



              {categories.find(c => c._id === currentMenu.category)?.name.toLowerCase() !== 'combo' ? (
                <div className={`space-y-4 p-2 rounded-xl transition-all ${errors.variants ? 'bg-primary/5 ring-1 ring-primary/30 border border-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-semibold ${errors.variants ? 'text-primary' : 'text-text-secondary'}`}>Size Variants</label>
                    {errors.variants && <p className="text-[10px] font-bold text-primary">Please select at least one size variant</p>}
                  </div>

                  {/* Checkbox Group for Variants */}
                  <div className="flex flex-wrap gap-3">
                    {[...new Set([...STANDARD_VARIANTS, ...currentMenu.variants.map(v => v.size)])].map(size => {
                      const isChecked = currentMenu.variants.some(v => v.size.toLowerCase() === size.toLowerCase());
                      return (
                        <label key={size} className={`flex items-center space-x-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-primary/10 border-primary shadow-sm' : 'bg-background border-border-main text-text-muted hover:border-primary/50'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCurrentMenu({
                                  ...currentMenu,
                                  variants: [...currentMenu.variants, { size, price: '', stockValue: 1, costPrice: 0, isBOGO: false, bogoItem: '', bogoVariant: '' }]
                                });
                                if (errors.variants) setErrors({ ...errors, variants: false });
                              } else {
                                setCurrentMenu({
                                  ...currentMenu,
                                  variants: currentMenu.variants.filter(v => v.size.toLowerCase() !== size.toLowerCase())
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-primary border-primary' : 'border-border-main bg-white'}`}>
                            {isChecked && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isChecked ? 'text-primary' : 'text-text-secondary'}`}>{size}</span>
                        </label>
                      );
                    })}
                  </div>

                  {currentMenu.variants.length > 0 && (
                    <div className="mt-4">
                      <label className="text-sm font-semibold text-text-secondary mb-3 block">Variant Pricing & Stock</label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {currentMenu.variants.map((variant, idx) => (
                          <div key={idx} className="group/variant bg-background-muted/30 p-3 rounded-xl border border-border-light space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between border-b border-border-light pb-2">
                              <div className="flex items-center space-x-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{variant.size}</span>
                                <div className="flex items-center space-x-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                                  <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Buy 1 Get 1</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSizeChange(idx, 'isBOGO', !variant.isBOGO)}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${variant.isBOGO ? 'bg-primary' : 'bg-text-muted'}`}
                                  >
                                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${variant.isBOGO ? 'translate-x-4' : 'translate-x-1'}`} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-end space-x-4">
                              <div className="space-y-1 w-28">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Sell Price (₹)</label>
                                <input
                                  type="number"
                                  value={variant.price === '' ? '' : (variant.price || 0)}
                                  onChange={(e) => handleSizeChange(idx, 'price', e.target.value)}
                                  className="w-full px-2 py-1 bg-background-card border border-border-main focus:border-primary/50 rounded-lg text-[11px] font-bold transition-all outline-none"
                                  placeholder="0"
                                />
                              </div>

                              <div className="space-y-1 w-24">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1 block">
                                  Stock Val
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={variant.stockValue}
                                  onChange={(e) => handleSizeChange(idx, 'stockValue', e.target.value)}
                                  className="w-full px-2 py-1 bg-background-card border border-border-main focus:border-primary/50 rounded-lg text-[11px] font-bold transition-all outline-none"
                                  placeholder="1"
                                />
                              </div>
                            </div>

                            {variant.isBOGO && (
                              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Select Free Item & Variant</span>
                                  {variant.bogoItem && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleSizeChange(idx, 'bogoItem', '');
                                        handleSizeChange(idx, 'bogoVariant', '');
                                      }}
                                      className="text-[9px] font-bold text-status-unavailable hover:underline"
                                    >
                                      Clear Selection
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 relative">
                                    <select
                                      value={variant.bogoItem ? `${variant.bogoItem}|${variant.bogoVariant}` : ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                          const [menuId, variantSize] = val.split('|');
                                          handleSizeChange(idx, 'bogoItem', menuId);
                                          handleSizeChange(idx, 'bogoVariant', variantSize);
                                        } else {
                                          handleSizeChange(idx, 'bogoItem', '');
                                          handleSizeChange(idx, 'bogoVariant', '');
                                        }
                                      }}
                                      className="w-full px-3 py-2 bg-background-card border border-border-main rounded-lg text-[11px] font-bold text-text-primary outline-none appearance-none cursor-pointer pr-8"
                                    >
                                      <option value="" className="bg-background-card text-text-primary">Select an item and variant...</option>
                                      {menus.map(m => (
                                        <Fragment key={m._id}>
                                          {m.variants?.length > 0 ? (
                                            m.variants.map((v, vIdx) => (
                                              <option key={`${m._id}-${vIdx}`} value={`${m._id}|${v.size}`} className="bg-background-card text-text-primary">
                                                {m.name} - {v.size}
                                              </option>
                                            ))
                                          ) : (
                                            <option value={`${m._id}|`} className="bg-background-card text-text-primary">
                                              {m.name}
                                            </option>
                                          )}
                                        </Fragment>
                                      ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                      <ArrowUpDown size={12} />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSizeChange(idx, 'bogoItem', '');
                                      handleSizeChange(idx, 'bogoVariant', '');
                                    }}
                                    className="p-2 text-text-muted hover:text-status-unavailable hover:bg-status-off/10 rounded-lg transition-all border border-border-main bg-background-card"
                                    title="Clear Selection"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Included Items Section */}
                            <div className="pt-2 border-t border-border-light/50">
                              <div className="flex items-center justify-end mb-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddIncludedItem(idx)}
                                  className="text-[9px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-lg border border-primary/20 transition-all flex items-center space-x-1"
                                >
                                  <Plus size={10} />
                                  <span>Add Item</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {variant.includedItems?.map((included, incIdx) => (
                                  <div key={incIdx} className="flex items-center space-x-2 bg-background-card/50 p-2 rounded-xl border border-border-main/50 animate-in slide-in-from-left-2 duration-200">
                                    <select
                                      value={included.menuItem}
                                      onChange={(e) => handleIncludedItemChange(idx, incIdx, 'menuItem', e.target.value)}
                                      className="flex-1 bg-transparent border-0 text-[11px] font-bold text-text-primary outline-none focus:ring-0 cursor-pointer"
                                    >
                                      <option value="" className="bg-background-card text-text-primary">Select Item</option>
                                      {menus.filter(m => m._id !== currentMenu._id).map(m => (
                                        <option key={m._id} value={m._id} className="bg-background-card text-text-primary">{m.name}</option>
                                      ))}
                                    </select>
                                    <div className="flex items-center space-x-2 border-l border-border-main pl-2">
                                      <span className="text-[10px] font-black text-text-muted">QTY:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={included.quantity}
                                        onChange={(e) => handleIncludedItemChange(idx, incIdx, 'quantity', e.target.value)}
                                        className="w-10 bg-transparent border-0 text-[11px] font-black text-primary text-center outline-none focus:ring-0 p-0"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveIncludedItem(idx, incIdx)}
                                      className="p-1 text-text-muted hover:text-status-unavailable transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Combo Items Section */
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-text-secondary">Combo Items Selection</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMenu({
                          ...currentMenu,
                          comboItems: [...currentMenu.comboItems, { menuItem: '', price: 0, quantity: 1 }]
                        });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 transition-all flex items-center space-x-1.5"
                    >
                      <Plus size={14} />
                      <span>Add Item to Combo</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentMenu.comboItems.length > 0 && (
                      <div className="flex items-center space-x-3 px-3 py-1">
                        <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-text-muted">Item</span>
                        <span className="w-24 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Price</span>
                        <span className="w-20 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Quantity</span>
                        <div className="w-8"></div>
                      </div>
                    )}
                    {currentMenu.comboItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 bg-background-muted/30 p-3 rounded-xl border border-border-light">
                        <select
                          value={item.menuItem}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const selectedMenu = menus.find(m => m._id === selectedId);
                            const newComboItems = [...currentMenu.comboItems];
                            newComboItems[idx] = {
                              ...newComboItems[idx],
                              menuItem: selectedId,
                              price: selectedMenu?.variants?.[0]?.price || 0, // Default to first variant price
                              quantity: newComboItems[idx].quantity || 1
                            };
                            setCurrentMenu({ ...currentMenu, comboItems: newComboItems });
                          }}
                          className="flex-1 bg-background-card border border-border-main rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                        >
                          <option value="" className="bg-background-card text-text-primary">Select Item</option>
                          {menus.filter(m => m._id !== currentMenu._id).map(m => (
                            <option key={m._id} value={m._id} className="bg-background-card text-text-primary">{m.name}</option>
                          ))}
                        </select>
                        <div className="w-24 relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">₹</span>
                          <input
                            type="number"
                            value={item.price === '' ? '' : (item.price || 0)}
                            onChange={(e) => {
                              const newComboItems = [...currentMenu.comboItems];
                              const val = e.target.value;
                              newComboItems[idx].price = val === '' ? '' : parseFloat(val);
                              setCurrentMenu({ ...currentMenu, comboItems: newComboItems });
                            }}
                            className="w-full pl-5 pr-2 py-2 bg-background-card border border-border-main rounded-lg text-sm text-text-primary outline-none"
                            placeholder="Price"
                          />
                        </div>
                        <div className="w-20 relative">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === '' ? '' : (item.quantity || 1)}
                            onChange={(e) => {
                              const newComboItems = [...currentMenu.comboItems];
                              const val = e.target.value;
                              newComboItems[idx].quantity = val === '' ? '' : parseInt(val);
                              setCurrentMenu({ ...currentMenu, comboItems: newComboItems });
                            }}
                            className="w-full px-2 py-2 bg-background-card border border-border-main rounded-lg text-sm text-text-primary outline-none text-center"
                            placeholder="Qty"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newComboItems = [...currentMenu.comboItems];
                            newComboItems.splice(idx, 1);
                            setCurrentMenu({ ...currentMenu, comboItems: newComboItems });
                          }}
                          className="p-2 text-text-muted hover:text-status-unavailable transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {currentMenu.comboItems.length > 0 && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-secondary">Total Original Price</span>
                        <span className="text-sm font-bold text-text-primary">₹{currentMenu.comboItems.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-text-secondary">Offer Percentage (%)</label>
                        <div className="w-24 relative">
                          <input
                            type="number"
                            value={currentMenu.offerPercentage === '' ? '' : currentMenu.offerPercentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentMenu({ ...currentMenu, offerPercentage: val === '' ? '' : parseFloat(val) });
                            }}
                            className="w-full px-3 py-1.5 bg-background-card border border-border-main rounded-lg text-sm text-text-primary outline-none text-right pr-6"
                            max="100"
                            min="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
                        <span className="text-base font-bold text-primary">Actual Combo Price</span>
                        <span className="text-lg font-black text-primary">
                          ₹{(
                            currentMenu.comboItems.reduce((sum, item) => sum + (item.price || 0), 0) *
                            (1 - (currentMenu.offerPercentage || 0) / 100)
                          ).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}




              <div className={`space-y-3 p-2 rounded-xl transition-all ${errors.image ? 'bg-primary/5 ring-1 ring-primary/30 border border-primary' : ''}`}>
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-semibold ${errors.image ? 'text-primary' : 'text-text-secondary'}`}>Item Image</label>
                  {errors.image && <p className="text-[10px] font-bold text-primary">Item Image is required</p>}
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className={`w-24 h-24 rounded-xl bg-background-muted border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 ${errors.image ? 'border-primary' : 'border-border-main'}`}>
                      {currentMenu.image ? (
                        <img src={currentMenu.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className={errors.image ? 'text-primary/50' : 'text-text-muted'} />
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
                          onChange={(e) => {
                            handleImageUpload(e);
                            if (errors.image) setErrors({ ...errors, image: false });
                          }}
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-[10px] text-text-muted">Recommended: Square image, max 3MB (JPG, PNG, WebP)</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Or Paste Image URL</label>
                    <input
                      type="text"
                      value={currentMenu.image}
                      onChange={(e) => {
                        setCurrentMenu({ ...currentMenu, image: e.target.value });
                        if (errors.image) setErrors({ ...errors, image: false });
                      }}
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
