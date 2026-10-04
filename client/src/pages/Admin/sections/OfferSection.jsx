import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showToast } from '../../../utils/sweetAlert';
import CardSkeleton from '../../../components/Skeleton/CardSkeleton';

const OfferSection = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [editingOffer, setEditingOffer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offerType: 'discount',
    offerValue: 0,
    bannerImage: '',
    isWeekendOnly: false,
    specificDays: [],
    applicableItems: [],
    getApplicableItems: [],
    applicableCategories: [],
    minQuantity: 1,
    priority: 0,
    isActive: true
  });
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [offersRes, catsRes, menusRes] = await Promise.all([
        api.get('/api/offers'),
        api.get('/api/categories?all=true'),
        api.get('/api/menus?all=true')
      ]);
      setOffers(offersRes.data.data || []);
      setCategories(catsRes.data || []);
      setMenus(menusRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Failed to fetch data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const generateDescription = () => {
    let desc = "";
    if (formData.offerType === 'bogo') {
      const itemNames = formData.applicableItems.map(id => menus.find(m => m._id === id.menuItem)?.name).filter(Boolean);
      const catNames = formData.applicableCategories.map(id => categories.find(c => c._id === id)?.name).filter(Boolean);
      desc = `Buy 1 Get 1 FREE on ${itemNames.length > 0 ? itemNames.join(', ') : catNames.length > 0 ? catNames.join(', ') : 'selected items'}!`;
    } else if (formData.offerType === 'discount') {
      desc = `Get ${formData.offerValue}% OFF on your favorite ${formData.applicableCategories.length > 0 ? 'items' : 'menu selection'}. Limited time only!`;
    } else if (formData.offerType === 'combo') {
      const count = formData.applicableItems.length;
      desc = `Special Bundle Deal: Get ${count} premium items with a ${formData.offerValue}% Bundle Discount! Save big on this feast.`;
    }
    setFormData({ ...formData, description: desc });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    
    // Clear unused fields based on selected scope
    const finalFormData = {
      ...formData,
      applicableItems: formData.applicableItems,
      getApplicableItems: formData.getApplicableItems,
      applicableCategories: []
    };

    Object.keys(finalFormData).forEach(key => {
      if (['specificDays', 'applicableCategories', 'applicableItems', 'getApplicableItems'].includes(key)) {
        data.append(key, JSON.stringify(finalFormData[key]));
      } else {
        data.append(key, finalFormData[key]);
      }
    });

    if (selectedFile) {
      data.append('bannerImage', selectedFile);
    }

    try {
      if (editingOffer) {
        await api.put(`/api/offers/${editingOffer._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('success', 'Promotion Updated');
      } else {
        await api.post('/api/offers', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('success', 'Promotion Launched');
      }
      setShowModal(false);
      resetForm();
      fetchOffers(true);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to save promotion');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      offerType: 'discount',
      offerValue: 0,
      bannerImage: '',
      isWeekendOnly: false,
      specificDays: [],
      applicableItems: [],
      getApplicableItems: [],
      applicableCategories: [],
      minQuantity: 1,
      priority: 0,
      isActive: true
    });
    setEditingOffer(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setItemCategoryFilter('all');
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    const hasItems = offer.applicableItems && offer.applicableItems.length > 0;
    setItemCategoryFilter('all');
    setFormData({
      title: offer.title,
      description: offer.description,
      offerType: offer.offerType,
      offerValue: offer.offerValue,
      bannerImage: offer.bannerImage,
      isWeekendOnly: offer.isWeekendOnly,
      specificDays: offer.specificDays || [],
      applicableItems: offer.applicableItems?.map(i => {
        const mItem = menus.find(m => m._id === (i.menuItem?._id || i.menuItem));
        return {
          categoryId: mItem ? (mItem.category?._id || mItem.category) : '',
          menuItem: i.menuItem?._id || i.menuItem,
          isChoice: i.isChoice || false,
          choiceGroupName: i.choiceGroupName || '',
          menuItems: i.menuItems?.map(m => m._id || m) || [],
          selectedSize: i.selectedSize || '',
          quantity: i.quantity || 1
        };
      }) || [],
      getApplicableItems: offer.getApplicableItems?.map(i => {
        const mItem = menus.find(m => m._id === (i.menuItem?._id || i.menuItem));
        return {
          categoryId: mItem ? (mItem.category?._id || mItem.category) : '',
          menuItem: i.menuItem?._id || i.menuItem,
          isChoice: i.isChoice || false,
          choiceGroupName: i.choiceGroupName || '',
          menuItems: i.menuItems?.map(m => m._id || m) || [],
          selectedSize: i.selectedSize || '',
          quantity: i.quantity || 1
        };
      }) || [],
      applicableCategories: offer.applicableCategories?.map(c => c._id || c) || [],
      minQuantity: offer.minQuantity || 1,
      priority: offer.priority,
      isActive: offer.isActive
    });
    setPreviewUrl(offer.bannerImage);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this promotion permanently?')) {
      try {
        await api.delete(`/api/offers/${id}`);
        showToast('success', 'Deleted');
        fetchOffers(true);
      } catch (error) {
        showToast('error', 'Failed to delete');
      }
    }
  };

  const toggleSelection = (itemId) => {
    const exists = formData.applicableItems.find(i => i.menuItem === itemId);
    if (exists) {
      setFormData({ ...formData, applicableItems: formData.applicableItems.filter(i => i.menuItem !== itemId) });
    } else {
      const menu = menus.find(m => m._id === itemId);
      const defaultSize = (menu?.variants?.[0]?.size || menu?.sizes?.[0]?.size || '');
      setFormData({ ...formData, applicableItems: [...formData.applicableItems, { menuItem: itemId, quantity: 1, selectedSize: defaultSize }] });
    }
  };

  const updateItemSize = (itemId, size) => {
    setFormData({ ...formData, applicableItems: formData.applicableItems.map(i => i.menuItem === itemId ? { ...i, selectedSize: size } : i) });
  };

  const updateItemQuantity = (itemId, qty) => {
    setFormData({ ...formData, applicableItems: formData.applicableItems.map(i => i.menuItem === itemId ? { ...i, quantity: Math.max(1, qty) } : i) });
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      specificDays: prev.specificDays.includes(day)
        ? prev.specificDays.filter(d => d !== day)
        : [...prev.specificDays, day]
    }));
  };

  const handleToggleStatus = async (offer) => {
    try {
      await api.patch(`/api/offers/${offer._id}/toggle`);
      showToast('success', `Status updated`);
      fetchOffers(true);
    } catch (error) {
      showToast('error', 'Failed to update status');
    }
  };

  const totalPages = Math.ceil(offers.length / itemsPerPage);
  const paginatedOffers = offers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading && offers.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight uppercase">Promotion Hub</h2>
          <p className="text-text-secondary text-sm font-medium">Create dynamic bundles and category-wide offers.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"><Plus size={20} />New Promotion</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedOffers.map((offer) => (
          <div key={offer._id} className="bg-background-card rounded-3xl border border-border/40 overflow-hidden group hover:shadow-2xl transition-all border-b-4 border-b-primary/40">
            <div className="relative h-36 overflow-hidden bg-background">
              <img src={offer.bannerImage} alt={offer.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${offer.offerType === 'bogo' ? 'bg-orange-600 text-white' : offer.offerType === 'combo' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>{offer.offerType}</span>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => handleToggleStatus(offer)} className="p-1.5 bg-black/20 backdrop-blur-md rounded-xl text-white hover:bg-black/40 transition-all border border-white/10">{offer.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-base font-black text-text-primary uppercase tracking-tight line-clamp-1">{offer.title}</h3>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5 opacity-60 line-clamp-2">{offer.description}</p>
              </div>
              <div className="flex items-center justify-end pt-3 border-t border-border/10">
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(offer)} className="p-2 bg-background-muted text-text-primary rounded-xl hover:bg-primary hover:text-white transition-all"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(offer._id)} className="p-2 bg-background-muted text-status-unavailable rounded-xl hover:bg-status-unavailable hover:text-white transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      {totalPages > 1 && (
        <div className="mt-8 p-6 bg-background-card rounded-[2rem] border border-border/40 flex items-center justify-between shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            Showing {paginatedOffers.length} of {offers.length} Promotions
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-2xl border border-border/40 hover:bg-background-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-primary hover:text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center px-6 h-12 bg-background border border-border/40 rounded-2xl">
              <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-2xl border border-border/40 hover:bg-background-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-primary hover:text-primary"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-background-card w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-background-muted/20">
              <h3 className="text-xl font-black text-text-primary uppercase">{editingOffer ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-background-muted rounded-full transition-colors"><CloseIcon size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Campaign Poster</label>
                <div onClick={() => fileInputRef.current.click()} className="w-full aspect-video bg-background border-2 border-dashed border-border/60 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden relative group shadow-inner">
                  {previewUrl ? <><img src={previewUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white" size={32} /></div></> : <><Upload className="text-text-muted/40 mb-2" size={48} /><span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Upload Poster</span></>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Promotion Title</label>
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Promotion Type</label>
                  <select value={formData.offerType} onChange={(e) => setFormData({ ...formData, offerType: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold">
                    <option value="discount">Percentage Discount</option>
                    <option value="bogo">Buy 1 Get 1 (BOGO)</option>
                    <option value="combo">Combo Bundle</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold min-h-[80px]" placeholder="Describe the offer..." />
              </div>

              {/* Dynamic Fields based on Offer Type */}
              <div className="p-6 bg-background rounded-[2rem] border border-border/40 space-y-6">
                
                {formData.offerType === 'discount' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-text-primary uppercase">Discount Details</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Percentage Discount (%)</label>
                      <input type="number" min="0" max="100" value={formData.offerValue} onChange={(e) => setFormData({ ...formData, offerValue: Number(e.target.value) })} className="w-full p-4 bg-background-card border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Items for Discount</label>
                      <div className="space-y-2">
                        {formData.applicableItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-3 bg-background border border-border/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                               <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                  <input type="checkbox" checked={item.isChoice} onChange={(e) => {
                                      const newItems = [...formData.applicableItems];
                                      newItems[idx].isChoice = e.target.checked;
                                      setFormData({ ...formData, applicableItems: newItems });
                                  }} className="rounded text-primary focus:ring-primary" />
                                  Make this a Choice Group (Option B)
                               </label>
                            </div>
                            
                            {item.isChoice && (
                              <div className="flex gap-2">
                                 <input type="text" placeholder="Group Name (e.g. Choose Drink)" value={item.choiceGroupName} onChange={(e) => {
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].choiceGroupName = e.target.value;
                                    setFormData({ ...formData, applicableItems: newItems });
                                 }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm font-bold" />
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <select value={item.categoryId || ''} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].categoryId = e.target.value;
                                newItems[idx].menuItem = '';
                                newItems[idx].menuItems = [];
                                newItems[idx].selectedSize = '';
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-32 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                              
                              {!item.isChoice ? (
                                <select value={item.menuItem} onChange={(e) => {
                                  const newItems = [...formData.applicableItems];
                                  newItems[idx].menuItem = e.target.value;
                                  setFormData({ ...formData, applicableItems: newItems });
                                }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                  <option value="">Select Item</option>
                                  {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex-1">
                                  <select multiple value={item.menuItems || []} onChange={(e) => {
                                    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].menuItems = opts;
                                    setFormData({ ...formData, applicableItems: newItems });
                                  }} className="w-full p-2 bg-background-card border border-border/40 rounded-xl outline-none text-sm h-24 no-scrollbar">
                                    {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                      <option key={m._id} value={m._id} className="p-1">{m.name}</option>
                                    ))}
                                  </select>
                                  <p className="text-[9px] text-text-muted mt-1 ml-1">Hold Ctrl/Cmd to select multiple options</p>
                                </div>
                              )}
                              
                              <select value={item.selectedSize} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].selectedSize = e.target.value;
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-32 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Any Size</option>
                                {menus.find(m => m._id === (item.isChoice ? (item.menuItems && item.menuItems[0]) : item.menuItem))?.variants?.map(v => (
                                  <option key={v.size} value={v.size}>{v.size}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => {
                                const newItems = [...formData.applicableItems];
                                newItems.splice(idx, 1);
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, applicableItems: [...formData.applicableItems, { categoryId: '', menuItem: '', menuItems: [], isChoice: false, choiceGroupName: '', selectedSize: '', quantity: 1 }] })} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 mt-2">
                          <Plus size={14} /> Add Item
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {formData.offerType === 'combo' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-text-primary uppercase">Combo Details</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Combo Total Amount (₹)</label>
                      <input type="number" min="0" value={formData.offerValue} onChange={(e) => setFormData({ ...formData, offerValue: Number(e.target.value) })} className="w-full p-4 bg-background-card border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Combo Items (Category, Name, Size)</label>
                      <div className="space-y-2">
                        {formData.applicableItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-3 bg-background border border-border/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                               <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                  <input type="checkbox" checked={item.isChoice} onChange={(e) => {
                                      const newItems = [...formData.applicableItems];
                                      newItems[idx].isChoice = e.target.checked;
                                      setFormData({ ...formData, applicableItems: newItems });
                                  }} className="rounded text-primary focus:ring-primary" />
                                  Make this a Choice Group
                               </label>
                            </div>
                            
                            {item.isChoice && (
                              <div className="flex gap-2">
                                 <input type="text" placeholder="Group Name (e.g. Choose Drink)" value={item.choiceGroupName} onChange={(e) => {
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].choiceGroupName = e.target.value;
                                    setFormData({ ...formData, applicableItems: newItems });
                                 }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm font-bold" />
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <select value={item.categoryId || ''} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].categoryId = e.target.value;
                                newItems[idx].menuItem = '';
                                newItems[idx].menuItems = [];
                                newItems[idx].selectedSize = '';
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-32 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                              
                              {!item.isChoice ? (
                                <select value={item.menuItem} onChange={(e) => {
                                  const newItems = [...formData.applicableItems];
                                  newItems[idx].menuItem = e.target.value;
                                  setFormData({ ...formData, applicableItems: newItems });
                                }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                  <option value="">Select Item</option>
                                  {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex-1">
                                  <select multiple value={item.menuItems || []} onChange={(e) => {
                                    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].menuItems = opts;
                                    setFormData({ ...formData, applicableItems: newItems });
                                  }} className="w-full p-2 bg-background-card border border-border/40 rounded-xl outline-none text-sm h-24 no-scrollbar">
                                    {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                      <option key={m._id} value={m._id} className="p-1">{m.name}</option>
                                    ))}
                                  </select>
                                  <p className="text-[9px] text-text-muted mt-1 ml-1">Hold Ctrl/Cmd to select multiple options</p>
                                </div>
                              )}
                              
                              <select value={item.selectedSize} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].selectedSize = e.target.value;
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-28 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Size</option>
                                {menus.find(m => m._id === (item.isChoice ? (item.menuItems && item.menuItems[0]) : item.menuItem))?.variants?.map(v => (
                                  <option key={v.size} value={v.size}>{v.size}</option>
                                ))}
                              </select>
                              <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-20 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm text-center" />
                              <button type="button" onClick={() => {
                                const newItems = [...formData.applicableItems];
                                newItems.splice(idx, 1);
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, applicableItems: [...formData.applicableItems, { categoryId: '', menuItem: '', menuItems: [], isChoice: false, choiceGroupName: '', selectedSize: '', quantity: 1 }] })} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 mt-2">
                          <Plus size={14} /> Add Item to Combo
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {formData.offerType === 'bogo' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-text-primary uppercase">Buy Requirements</h4>
                      <div className="space-y-2">
                        {formData.applicableItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-3 bg-background border border-border/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                               <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                  <input type="checkbox" checked={item.isChoice} onChange={(e) => {
                                      const newItems = [...formData.applicableItems];
                                      newItems[idx].isChoice = e.target.checked;
                                      setFormData({ ...formData, applicableItems: newItems });
                                  }} className="rounded text-primary focus:ring-primary" />
                                  Make this a Choice Group
                               </label>
                            </div>
                            
                            {item.isChoice && (
                              <div className="flex gap-2">
                                 <input type="text" placeholder="Group Name (e.g. Choose Item)" value={item.choiceGroupName} onChange={(e) => {
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].choiceGroupName = e.target.value;
                                    setFormData({ ...formData, applicableItems: newItems });
                                 }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm font-bold" />
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <select value={item.categoryId || ''} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].categoryId = e.target.value;
                                newItems[idx].menuItem = '';
                                newItems[idx].menuItems = [];
                                newItems[idx].selectedSize = '';
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-32 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                              
                              {!item.isChoice ? (
                                <select value={item.menuItem} onChange={(e) => {
                                  const newItems = [...formData.applicableItems];
                                  newItems[idx].menuItem = e.target.value;
                                  setFormData({ ...formData, applicableItems: newItems });
                                }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                  <option value="">Select Item</option>
                                  {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex-1">
                                  <select multiple value={item.menuItems || []} onChange={(e) => {
                                    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                    const newItems = [...formData.applicableItems];
                                    newItems[idx].menuItems = opts;
                                    setFormData({ ...formData, applicableItems: newItems });
                                  }} className="w-full p-2 bg-background-card border border-border/40 rounded-xl outline-none text-sm h-24 no-scrollbar">
                                    {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                      <option key={m._id} value={m._id} className="p-1">{m.name}</option>
                                    ))}
                                  </select>
                                  <p className="text-[9px] text-text-muted mt-1 ml-1">Hold Ctrl/Cmd to select multiple options</p>
                                </div>
                              )}
                              
                              <select value={item.selectedSize} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].selectedSize = e.target.value;
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-28 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Size</option>
                                {menus.find(m => m._id === (item.isChoice ? (item.menuItems && item.menuItems[0]) : item.menuItem))?.variants?.map(v => (
                                  <option key={v.size} value={v.size}>{v.size}</option>
                                ))}
                              </select>
                              <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => {
                                const newItems = [...formData.applicableItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="w-20 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm text-center" />
                              <button type="button" onClick={() => {
                                const newItems = [...formData.applicableItems];
                                newItems.splice(idx, 1);
                                setFormData({ ...formData, applicableItems: newItems });
                              }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, applicableItems: [...formData.applicableItems, { categoryId: '', menuItem: '', menuItems: [], isChoice: false, choiceGroupName: '', selectedSize: '', quantity: 1 }] })} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 mt-2">
                          <Plus size={14} /> Add Buy Item
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/20">
                      <h4 className="text-sm font-black text-primary uppercase">Get Free / Discounted Items</h4>
                      <div className="space-y-2">
                        {formData.getApplicableItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-2 p-3 bg-background border border-border/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                               <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
                                  <input type="checkbox" checked={item.isChoice} onChange={(e) => {
                                      const newItems = [...formData.getApplicableItems];
                                      newItems[idx].isChoice = e.target.checked;
                                      setFormData({ ...formData, getApplicableItems: newItems });
                                  }} className="rounded text-primary focus:ring-primary" />
                                  Make this a Choice Group
                               </label>
                            </div>
                            
                            {item.isChoice && (
                              <div className="flex gap-2">
                                 <input type="text" placeholder="Group Name (e.g. Choose Free Item)" value={item.choiceGroupName} onChange={(e) => {
                                    const newItems = [...formData.getApplicableItems];
                                    newItems[idx].choiceGroupName = e.target.value;
                                    setFormData({ ...formData, getApplicableItems: newItems });
                                 }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm font-bold" />
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <select value={item.categoryId || ''} onChange={(e) => {
                                const newItems = [...formData.getApplicableItems];
                                newItems[idx].categoryId = e.target.value;
                                newItems[idx].menuItem = '';
                                newItems[idx].menuItems = [];
                                newItems[idx].selectedSize = '';
                                setFormData({ ...formData, getApplicableItems: newItems });
                              }} className="w-32 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                              
                              {!item.isChoice ? (
                                <select value={item.menuItem} onChange={(e) => {
                                  const newItems = [...formData.getApplicableItems];
                                  newItems[idx].menuItem = e.target.value;
                                  setFormData({ ...formData, getApplicableItems: newItems });
                                }} className="flex-1 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                  <option value="">Select Item</option>
                                  {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex-1">
                                  <select multiple value={item.menuItems || []} onChange={(e) => {
                                    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                    const newItems = [...formData.getApplicableItems];
                                    newItems[idx].menuItems = opts;
                                    setFormData({ ...formData, getApplicableItems: newItems });
                                  }} className="w-full p-2 bg-background-card border border-border/40 rounded-xl outline-none text-sm h-24 no-scrollbar">
                                    {menus.filter(m => !item.categoryId || (m.category?._id || m.category) === item.categoryId).map(m => (
                                      <option key={m._id} value={m._id} className="p-1">{m.name}</option>
                                    ))}
                                  </select>
                                  <p className="text-[9px] text-text-muted mt-1 ml-1">Hold Ctrl/Cmd to select multiple options</p>
                                </div>
                              )}
                              
                              <select value={item.selectedSize} onChange={(e) => {
                                const newItems = [...formData.getApplicableItems];
                                newItems[idx].selectedSize = e.target.value;
                                setFormData({ ...formData, getApplicableItems: newItems });
                              }} className="w-28 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm">
                                <option value="">Size</option>
                                {menus.find(m => m._id === (item.isChoice ? (item.menuItems && item.menuItems[0]) : item.menuItem))?.variants?.map(v => (
                                  <option key={v.size} value={v.size}>{v.size}</option>
                                ))}
                              </select>
                              <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => {
                                const newItems = [...formData.getApplicableItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setFormData({ ...formData, getApplicableItems: newItems });
                              }} className="w-20 p-3 bg-background-card border border-border/40 rounded-xl outline-none text-sm text-center" />
                              <button type="button" onClick={() => {
                                const newItems = [...formData.getApplicableItems];
                                newItems.splice(idx, 1);
                                setFormData({ ...formData, getApplicableItems: newItems });
                              }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setFormData({ ...formData, getApplicableItems: [...formData.getApplicableItems, { categoryId: '', menuItem: '', menuItems: [], isChoice: false, choiceGroupName: '', selectedSize: '', quantity: 1 }] })} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 mt-2">
                          <Plus size={14} /> Add Get Item
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/40">
                <div>
                  <p className="text-[11px] font-black text-text-primary uppercase">Promotion Status</p>
                  <p className="text-[9px] text-text-muted mt-0.5">{formData.isActive ? 'Active and visible to customers' : 'Inactive and hidden'}</p>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} className="transition-all">
                  {formData.isActive ? <ToggleRight size={32} className="text-primary" /> : <ToggleLeft size={32} className="text-text-muted/40" />}
                </button>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-background-muted transition-all">Cancel</button>
                <button type="submit" className="flex-1 p-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">{editingOffer ? 'Save Changes' : 'Launch Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferSection;
