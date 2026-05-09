import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Settings,
  Bell,
  Search,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  DollarSign,
  ShoppingCart,
  BookOpen,
  LineChart,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CategorySection from './sections/CategorySection';
import MenuSection from './sections/MenuSection';

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login', { replace: true });
  };

  const metrics = [
    { label: 'Total Revenue', value: '₹124,592', description: 'Lifetime earnings', icon: DollarSign, color: 'text-primary' },
    { label: 'Today Revenue', value: '₹1,240', description: 'Daily earnings', icon: TrendingUp, color: 'text-status-available' },
    { label: 'Total Orders', value: '4,821', description: 'Order count', icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Customers', value: '1,204', description: 'Unique customers', icon: Users, color: 'text-purple-500' },
    { label: 'Menu Items', value: '84', description: 'Catalogue size', icon: BookOpen, color: 'text-amber-500' },
    { label: 'Avg Order Value', value: '₹25.80', description: 'Average spend', icon: BarChart3, color: 'text-pink-500' },
  ];

  const recentOrders = [
    { id: '#ORD-7234', customer: 'Anwar Sadat', items: 'Chicken Biryani, Lime Soda', type: 'Dine-in', amount: '₹450', status: 'Pending', time: '5 mins ago' },
    { id: '#ORD-7233', customer: 'Rahul K.', items: 'Alfaham, Roti', type: 'Takeaway', amount: '₹320', status: 'Delivered', time: '12 mins ago' },
    { id: '#ORD-7232', customer: 'Aiswarya R.', items: 'Beef Roast, Appam x4', type: 'Delivery', amount: '₹580', status: 'Preparing', time: '18 mins ago' },
    { id: '#ORD-7231', customer: 'Kevin John', items: 'Club Sandwich, Fries', type: 'Dine-in', amount: '₹210', status: 'Delivered', time: '25 mins ago' },
  ];

  const lowStockItems = [
    { item: 'Chicken Biriyani', category: 'Main Course', stock: '5 portions', threshold: '15 portions', status: 'Critical' },
    { item: 'Alfaham', category: 'Grill', stock: '3 full', threshold: '10 full', status: 'Critical' },
    { item: 'Beef Roast', category: 'Side Dish', stock: '4 portions', threshold: '8 portions', status: 'Low' },
    { item: 'Lime Soda', category: 'Beverages', stock: '8 servings', threshold: '15 servings', status: 'Low' },
  ];

  const charts = [
    { name: 'Revenue Trend', type: 'Line Chart', purpose: 'Daily / weekly / monthly revenue over time', icon: LineChart },
    { name: 'Order Distribution', type: 'Pie Chart', purpose: 'Breakdown by order type (Dine-in / Takeaway / Delivery)', icon: PieChartIcon },
    { name: 'Top Items', type: 'Bar Chart', purpose: 'Best-selling menu items ranked by quantity', icon: BarChart3 },
  ];

  return (
    <div className={`flex h-screen bg-background text-text-primary overflow-hidden transition-colors duration-300`}>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-background-card border-border flex flex-col transition-all duration-300 ease-in-out transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-22' : 'lg:w-64'}
        w-64
      `}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`
            hidden lg:flex absolute -right-3 top-10 p-1.5 bg-primary text-white rounded-full shadow-lg border-2 border-bg-card z-20 transition-transform duration-300
            ${!isSidebarCollapsed ? 'rotate-180' : ''}
          `}
        >
          <ChevronRight size={14} />
        </button>

        <div className="flex-1 flex flex-col overflow-x-hidden no-scrollbar relative">
          <div className={`p-6 border-b border-border-light flex items-center justify-center relative ${isSidebarCollapsed ? 'lg:justify-center' : 'lg:justify-between'}`}>
            <img
              src={
                (isSidebarCollapsed && !isMobileMenuOpen)
                  ? "/browser-icon.png"
                  : (isDarkMode ? "/logo-light.png" : "/logo-dark.png")
              }
              alt="Logo"
              className={`${(isSidebarCollapsed && !isMobileMenuOpen) ? 'h-8' : 'h-10'} w-auto transition-all duration-500`}
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden absolute right-6 p-2 text-text-secondary hover:text-status-unavailable transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            {[
              { name: 'Overview', icon: LayoutDashboard },
              { name: 'Staff Management', icon: Users },
              { name: 'Categories', icon: BookOpen },
              { name: 'Menu Editor', icon: UtensilsCrossed },
              { name: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveTab(item.name);
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed && !isMobileMenuOpen ? item.name : ''}
                className={`w-full flex items-center rounded-xl transition-all duration-200 p-3 group ${activeTab === item.name
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold'
                    : 'text-text-secondary hover:bg-background-muted hover:text-text-primary'
                  } ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : 'space-x-3'}`}
              >
                <item.icon size={20} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className={`
                  transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
                `}>
                  {item.name}
                </span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border-light space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center rounded-xl text-status-unavailable hover:bg-status-off/5 transition-all p-3 ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'justify-center' : ''}`}
            >
              <LogOut size={20} className="shrink-0" />
              <span className={`
                transition-all duration-300 overflow-hidden whitespace-nowrap font-medium
                ${(isSidebarCollapsed && !isMobileMenuOpen) ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}
              `}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-22' : 'lg:ml-64'}`}>
        <header className="h-20 bg-background-card border-b border-border-main flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:bg-background-muted rounded-lg group"
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
            <div className="relative hidden sm:flex w-64 lg:w-96 font-sans">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-background-muted rounded-lg border-transparent focus:bg-white focus:border-primary/20 transition-all outline-none text-sm dark:bg-background-muted/50 dark:focus:bg-background-muted"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-muted rounded-lg transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="relative text-text-secondary hover:text-primary transition-all p-2 bg-background-muted/30 rounded-lg group">
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background-card shadow-sm">
                2
              </span>
            </button>
            <div className="flex items-center space-x-3 border-l pl-4 sm:pl-6 border-border-light">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-text-primary">Admin</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">Superuser</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8">
          {activeTab === 'Overview' && (
            <>
              {/* Welcome Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Restaurant Overview</h2>
                  <p className="text-text-secondary text-sm">Key performance metrics and trend analysis.</p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-background-card border border-border-main text-text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-background-muted transition-colors">
                    Export Table
                  </button>
                  <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary-light transition-all">
                    Update Data
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-background-card p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-background-muted group-hover:scale-110 transition-transform ${metric.color}`}>
                        <metric.icon size={20} />
                      </div>
                      <TrendingUp className="text-status-available shrink-0" size={14} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-text-secondary text-[11px] font-bold uppercase tracking-wider">{metric.label}</p>
                      <p className="text-2xl font-bold text-text-primary">{metric.value}</p>
                      <p className="text-text-muted text-[10px] italic">{metric.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Tables Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Orders Table */}
                <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-border-light flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">Recent Orders</h3>
                      <p className="text-text-secondary text-xs">Live status of incoming orders</p>
                    </div>
                    <button className="text-primary text-xs font-bold hover:underline">View All</button>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-background-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-bold text-text-primary">{order.id}</p>
                              <p className="text-[10px] text-text-muted">{order.time}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-text-primary">{order.customer}</p>
                              <p className="text-[10px] text-text-muted truncate max-w-[120px]">{order.items}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-medium text-text-secondary bg-background-muted px-2 py-0.5 rounded-md border border-border-light">
                                {order.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-text-primary">{order.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'Delivered' ? 'bg-status-on/10 text-status-available' :
                                order.status === 'Preparing' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-primary/10 text-primary'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Menu Stock Alerts Table */}
                <div className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-border-light flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">Menu Stock Alerts</h3>
                      <p className="text-text-secondary text-xs">Portions remaining for popular dishes</p>
                    </div>
                    <button className="text-primary text-xs font-bold hover:underline">Update Menu</button>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-background-muted/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Menu Item</th>
                          <th className="px-6 py-4">Portions Left</th>
                          <th className="px-6 py-4">Daily Goal</th>
                          <th className="px-6 py-4">Availability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {lowStockItems.map((item) => (
                          <tr key={item.item} className="hover:bg-background-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-text-primary">{item.item}</p>
                              <p className="text-[10px] text-text-muted uppercase">{item.category}</p>
                            </td>
                            <td className="px-6 py-4 text-text-primary font-medium">{item.stock}</td>
                            <td className="px-6 py-4 text-text-secondary">{item.threshold}</td>
                            <td className="px-6 py-4">
                              <span className={`${
                                item.status === 'Critical' ? 'text-status-unavailable' : 'text-amber-500'
                              } flex items-center space-x-1 font-bold text-[10px] uppercase tracking-wider`}>
                                <AlertCircle size={12} />
                                <span>{item.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-text-primary border-l-4 border-primary pl-4">Analytics Visualization</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {charts.map((chart) => (
                    <div key={chart.name} className="bg-background-card rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 bg-background-muted/50 border-b border-border-light flex items-center justify-between">
                        <span className="font-bold text-sm text-text-primary">{chart.name}</span>
                        <chart.icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[200px] border-b border-border-light relative overflow-hidden group">
                        <div className="absolute inset-x-8 inset-y-12 bg-primary/5 rounded-lg border border-dashed border-primary/20 flex flex-col items-center justify-center p-4">
                          <chart.icon size={48} className="text-primary/20 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">{chart.type}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-background-card">
                        <p className="text-xs text-text-secondary leading-relaxed italic">{chart.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Categories' && <CategorySection />}
          {activeTab === 'Menu Editor' && <MenuSection />}
          
          {activeTab === 'Staff Management' && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border-light rounded-2xl">
              <p className="text-text-secondary font-medium italic">Staff Management section coming soon...</p>
            </div>
          )}
          
          {activeTab === 'Settings' && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border-light rounded-2xl">
              <p className="text-text-secondary font-medium italic">Settings section coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
