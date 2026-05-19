import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Calendar,
  Ticket,
  Percent,
  Layers,
  ChevronRight,
  MoreVertical,
  Gift,
  Upload,
  X as CloseIcon,
  Package,
  Check,
  Minus,
  Sparkles,
  Info,
  ChevronLeft
} from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showToast } from '../../../utils/sweetAlert';
import Loader from '../../../components/Loader/Loader';

const OfferSection = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    applicableCategories: [],
    minQuantity: 1,
    priority: 0,
    isActive: true
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [offersRes, catsRes, menusRes] = await Promise.all([
        api.get('/api/offers'),
        api.get('/api/categories'),
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
    Object.keys(formData).forEach(key => {
      if (['specificDays', 'applicableCategories', 'applicableItems'].includes(key)) {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
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
      applicableCategories: [],
      minQuantity: 1,
      priority: 0,
      isActive: true
    });
    setEditingOffer(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      offerType: offer.offerType,
      offerValue: offer.offerValue,
      bannerImage: offer.bannerImage,
      isWeekendOnly: offer.isWeekendOnly,
      specificDays: offer.specificDays || [],
      applicableItems: offer.applicableItems?.map(i => ({
        menuItem: i.menuItem?._id || i.menuItem,
        selectedSize: i.selectedSize || '',
        quantity: i.quantity || 1
      })) || [],
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

  if (loading && offers.length === 0) return <Loader />;

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
                <button onClick={() => toggleStatus(offer)} className="p-1.5 bg-black/20 backdrop-blur-md rounded-xl text-white hover:bg-black/40 transition-all border border-white/10">{offer.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}</button>
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

      {/* Pagination */}
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
          <div className="relative bg-background-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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

              {/* Offer Value — discount & combo */}
              {(formData.offerType === 'discount' || formData.offerType === 'combo') && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">
                    {formData.offerType === 'discount' ? 'Discount Percentage' : 'Bundle Discount Percentage'}
                  </label>
                  <div className="relative">
                    <input type="number" value={formData.offerValue} onChange={(e) => setFormData({ ...formData, offerValue: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold pr-12" placeholder="e.g. 20 for 20% OFF" />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  </div>
                </div>
              )}

              {/* BOGO — bundle size + min qty */}
              {formData.offerType === 'bogo' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Bundle Size</label>
                    <input type="number" min="2" max="10" value={formData.offerValue || 2} onChange={(e) => setFormData({ ...formData, offerValue: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none font-bold" placeholder="2 = Buy 1 Get 1" />
                    <p className="text-[9px] text-text-muted ml-1">2 = classic Buy 1 Get 1 Free</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Min Qty to Trigger</label>
                    <input type="number" min="1" value={formData.minQuantity} onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none font-bold" />
                  </div>
                </div>
              )}

              {/* Discount — min qty */}
              {formData.offerType === 'discount' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Min Qty to Unlock Discount</label>
                  <input type="number" min="1" value={formData.minQuantity} onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none font-bold" />
                </div>
              )}

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Description</label>
                  <button type="button" onClick={generateDescription} className="text-[8px] font-black text-primary flex items-center gap-1 hover:underline"><Sparkles size={10} /> Auto-Generate</button>
                </div>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none transition-all font-bold min-h-[80px]" />
              </div>

              {formData.offerType !== 'combo' ? (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Applicable Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button key={cat._id} type="button" onClick={() => setFormData({ ...formData, applicableCategories: formData.applicableCategories.includes(cat._id) ? formData.applicableCategories.filter(id => id !== cat._id) : [...formData.applicableCategories, cat._id] })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.applicableCategories.includes(cat._id) ? 'bg-primary border-primary text-white' : 'bg-background border-border/40 text-text-muted'}`}>{cat.name}</button>
                      ))}
                    </div>
                  </div>
                  {/* BOGO — also target specific items */}
                  {formData.offerType === 'bogo' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Or Specific Items <span className="opacity-50 normal-case font-medium">(leave empty = all in category)</span></label>
                      <div className="bg-background border border-border/40 rounded-3xl p-3 max-h-[160px] overflow-y-auto no-scrollbar space-y-1">
                        {menus.map(item => {
                          const sel = formData.applicableItems.find(i => i.menuItem === item._id);
                          return (
                            <div key={item._id} onClick={() => toggleSelection(item._id)} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${sel ? 'bg-primary/10 border-primary/30' : 'border-transparent hover:bg-background-card/60'}`}>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-primary border-primary text-white' : 'border-border/60'}`}>{sel && <Check size={12} strokeWidth={4} />}</div>
                              <span className="text-[11px] font-black text-text-primary uppercase truncate">{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Bundle Items & Quantities</label>
                  <div className="space-y-2 bg-background border border-border/40 rounded-3xl p-4 max-h-[250px] overflow-y-auto no-scrollbar">
                    {menus.map(item => {
                      const selected = formData.applicableItems.find(i => i.menuItem === item._id);
                      return (
                        <div key={item._id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selected ? 'border-primary bg-primary/5' : 'border-transparent bg-background-card/50'}`}>
                          <div className="flex items-center gap-3"><button type="button" onClick={() => toggleSelection(item._id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'bg-primary border-primary text-white' : 'border-border/60 bg-background'}`}>{selected && <Check size={14} strokeWidth={4} />}</button><span className="text-[11px] font-black text-text-primary uppercase truncate">{item.name}</span></div>
                          {selected && (
                            <div className="flex items-center gap-3">
                              {/* SIZE DROPDOWN */}
                              {(item.variants?.length > 0 || item.sizes?.length > 0) && (
                                <select 
                                  value={selected.selectedSize} 
                                  onChange={(e) => updateItemSize(item._id, e.target.value)}
                                  className="bg-background text-text-primary border border-border/40 rounded-xl px-2 py-1 text-[9px] font-black uppercase outline-none focus:border-primary transition-all cursor-pointer"
                                >
                                  {(item.variants || item.sizes).map(v => (
                                    <option key={v.size} value={v.size} className="bg-background text-text-primary">{v.size}</option>
                                  ))}
                                </select>
                              )}
                              
                              <div className="flex items-center bg-background rounded-xl border border-border/40 p-0.5 shadow-sm">
                                <button type="button" onClick={() => updateItemQuantity(item._id, selected.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-text-primary hover:text-primary transition-all"><Minus size={14} /></button>
                                <span className="w-7 text-center text-[11px] font-black text-text-primary">{selected.quantity}</span>
                                <button type="button" onClick={() => updateItemQuantity(item._id, selected.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-text-primary hover:text-primary transition-all"><Plus size={14} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scheduling */}
              <div className="space-y-4 pt-2 border-t border-border/20">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active Schedule</label>
                <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/40">
                  <div>
                    <p className="text-[11px] font-black text-text-primary uppercase">Weekend Only</p>
                    <p className="text-[9px] text-text-muted mt-0.5">Active only on Sat &amp; Sun</p>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, isWeekendOnly: !formData.isWeekendOnly, specificDays: [] })} className="transition-all">
                    {formData.isWeekendOnly ? <ToggleRight size={32} className="text-primary" /> : <ToggleLeft size={32} className="text-text-muted/40" />}
                  </button>
                </div>
                {!formData.isWeekendOnly && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-text-muted uppercase ml-1">Specific Days <span className="opacity-50 normal-case font-medium">(empty = every day)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.specificDays.includes(day) ? 'bg-primary border-primary text-white' : 'bg-background border-border/40 text-text-muted'}`}>{day.slice(0, 3)}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Priority <span className="opacity-50 normal-case font-medium">(higher number = applied first)</span></label>
                <input type="number" min="0" max="10" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full p-4 bg-background border border-border/40 rounded-2xl focus:border-primary outline-none font-bold" placeholder="0 = lowest" />
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
