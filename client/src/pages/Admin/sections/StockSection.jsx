import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Plus, Edit2, Trash2, RotateCcw } from 'lucide-react';
import api from '../../../api/axiosInstance';
import { showToast } from '../../../utils/sweetAlert';
import Swal from 'sweetalert2';
import Loader from '../../../components/Loader/Loader';
import Pagination from '../../../components/Pagination/Pagination';

const StockSection = ({ refreshKey }) => {
  const [activeTab, setActiveTab] = useState('category'); // 'category' or 'menu'
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (refreshKey) {
      fetchData(true);
    }
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [catRes, menuRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/menus')
      ]);
      setCategories(catRes.data);
      setMenus(menuRes.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleUpdateCategoryStock = async (category) => {
    const { value: amount } = await Swal.fire({
      title: 'Update Category Stock',
      input: 'number',
      inputLabel: `Set total stock for ${category.name}`,
      inputPlaceholder: `Current: ${category.totalStock || 0}`,
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: 'var(--color-primary)',
      background: 'var(--color-background-card)',
      color: 'var(--color-text-primary)',
      inputValue: category.totalStock > 0 ? category.totalStock : '',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
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
        showToast('success', `Stock updated for ${category.name}`);
        fetchData(true);
      } catch (error) {
        console.error('Error updating category stock:', error);
        showToast('error', 'Failed to update stock');
        fetchData(true);
      }
    }
  };

  const handleDeleteCategoryStock = async (category) => {
    try {
      setCategories(prev => prev.map(c => c._id === category._id ? { ...c, totalStock: 0, stockactive: false } : c));
      await api.put(`/api/categories/${category._id}`, { ...category, totalStock: 0, stockactive: false });
      showToast('success', `Stock reset to 0 for ${category.name}`);
      fetchData(true);
    } catch (error) {
      console.error('Error resetting stock:', error);
      showToast('error', 'Failed to reset stock');
      fetchData(true);
    }
  };

  const handleUpdateMenuStock = async (menu) => {
    const { value: amount } = await Swal.fire({
      title: 'Update Menu Stock',
      input: 'number',
      inputLabel: `Set total stock for ${menu.name}`,
      inputPlaceholder: `Current: ${menu.totalStock || 0}`,
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: 'var(--color-primary)',
      background: 'var(--color-background-card)',
      color: 'var(--color-text-primary)',
      inputValue: menu.totalStock > 0 ? menu.totalStock : '',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'Please enter a valid amount (0 or more)';
        }
      }
    });

    if (amount) {
      const newStock = parseInt(amount);
      try {
        setMenus(prev => prev.map(m => m._id === menu._id ? { ...m, totalStock: newStock } : m));
        await api.put(`/api/menus/${menu._id}`, { ...menu, totalStock: newStock });
        showToast('success', `Stock updated for ${menu.name}`);
      } catch (error) {
        console.error('Error updating menu stock:', error);
        showToast('error', 'Failed to update stock');
        fetchData(true);
      }
    }
  };

  const handleDeleteMenuStock = async (menu) => {
    try {
      setMenus(prev => prev.map(m => m._id === menu._id ? { ...m, totalStock: 0 } : m));
      await api.put(`/api/menus/${menu._id}`, { ...menu, totalStock: 0 });
      showToast('success', `Stock reset to 0 for ${menu.name}`);
    } catch (error) {
      console.error('Error resetting menu stock:', error);
      showToast('error', 'Failed to reset stock');
      fetchData(true);
    }
  };

  const getCalculatedStock = (menu) => {
    if (menu.category?.stockactive) {
      return menu.category.totalStock || 0;
    }
    return menu.totalStock || 0;
  };

  const renderCategoryTable = () => {
    const filtered = categories.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-2 py-4 w-12 text-center">#</th>
                <th className="px-3 py-4">Category</th>
                <th className="px-3 py-4 text-center">Total Stock</th>
                <th className="px-3 py-4 text-center">Managed Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <Loader size="large" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted italic">No categories found.</td>
                </tr>
              ) : (
                paginated.map((category, index) => (
                  <tr key={category._id} className="hover:bg-background-muted/30 transition-colors">
                    <td className="px-2 py-4 text-center font-medium text-text-muted">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-3 py-4 font-bold text-text-primary">{category.name}</td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        {category.totalStock > 0 ? (
                          <>
                            <span className="font-bold text-text-primary text-sm">{category.totalStock}</span>
                            <button
                              onClick={() => handleUpdateCategoryStock(category)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Edit Stock"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategoryStock(category)}
                              className="p-1.5 text-status-unavailable hover:bg-status-off/10 rounded transition-colors"
                              title="Reset Stock"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUpdateCategoryStock(category)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg transition-colors text-xs font-bold"
                            title="Add Stock"
                          >
                            <Plus size={14} />
                            <span>Add Stock</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {category.stockactive ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-black uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-status-off/10 text-status-unavailable border border-status-off/20 rounded text-[10px] font-black uppercase">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </>
    );
  };

  const renderMenuTable = () => {
    const filteredMenus = menus.filter(m => {
      const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });

    const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
    const paginated = filteredMenus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-light">
              <tr>
                <th className="px-2 py-4 w-12 text-center">#</th>
                <th className="px-3 py-4">Menu Item</th>
                <th className="px-3 py-4">Category</th>
                <th className="px-3 py-4 text-center">Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <Loader size="large" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-text-muted italic">No menu items found.</td>
                </tr>
              ) : (
                paginated.map((menu, index) => {
                  const catStockActive = menu.category?.stockactive;
                  return (
                    <tr key={menu._id} className="hover:bg-background-muted/30 transition-colors">
                      <td className="px-2 py-4 text-center font-medium text-text-muted">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-3 py-4 font-bold text-text-primary">{menu.name}</td>
                      <td className="px-3 py-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary bg-background-muted/80 px-2 py-0.5 rounded border border-border-light">
                          {menu.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center">
                          {catStockActive ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-text-primary mb-1">{menu.category?.totalStock || 0}</span>
                              <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                Category Managed
                              </span>
                            </div>
                          ) : menu.totalStock > 0 ? (
                            <div className="flex items-center justify-center space-x-2">
                              <span className="text-sm font-black text-text-primary">{menu.totalStock}</span>
                              <button
                                onClick={() => handleUpdateMenuStock(menu)}
                                className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                title="Edit Stock"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuStock(menu)}
                                className="p-1 text-status-unavailable hover:bg-status-off/10 rounded transition-colors"
                                title="Reset Stock"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUpdateMenuStock(menu)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg transition-colors text-[10px] font-bold"
                              title="Add Stock"
                            >
                              <Plus size={12} />
                              <span>Add Stock</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Stock Management</h2>
          <p className="text-text-secondary text-sm">Manage inventory levels across categories and items</p>
        </div>
      </div>

      <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-light bg-background-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-2 p-1 bg-background-muted/50 border border-border-main rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('category')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'category'
                  ? 'bg-background-card text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Category-wise
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-background-card text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Menu-wise
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'category' ? 'categories' : 'items'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-card rounded-lg border border-border-main focus:border-primary/50 transition-all outline-none text-sm"
            />
          </div>

        </div>

        {activeTab === 'category' ? renderCategoryTable() : renderMenuTable()}
      </div>
    </div>
  );
};

export default StockSection;
