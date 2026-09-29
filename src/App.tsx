import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import VenuesPage from './components/Venues/VenuesPage';
import BookingsPage from './components/Bookings/BookingsPage';
import UsersPage from './components/Users/UsersPage';
import VendorsPage from './components/Vendors/VendorsPage';
import PaymentsPage from './components/Payments/PaymentsPage';
import EMIPage from './components/EMI/EMIPage';
import WeddingPlansPage from './components/WeddingPlans/WeddingPlansPage';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';
import OrdersPage from './components/Orders/OrdersPage';
import AdminBlogPage from './components/Blog/BlogPage';
import AdminOffersPage from './components/Offers/OffersPage';
import ChatSupportPage from './components/Chat/ChatSupportPage';
import LoginPage from './components/Auth/LoginPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { adminApi } from './services/api';

type PageType = 'dashboard' | 'venues' | 'bookings' | 'users' | 'vendors' | 'payments' | 'emi' | 'wedding-plans' | 'orders' | 'blog' | 'offers' | 'chat-support' | 'reports' | 'settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminApi.isAuthenticated());
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emiEnabled, setEmiEnabled] = useState(false);

  useEffect(() => {
    // Verify session on mount - for admin, we just check the stored token
    // The backend will verify on each request
    if (adminApi.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch emiEnabled from settings
  useEffect(() => {
    if (isAuthenticated) {
      adminApi.getSettings().then((res: any) => {
        const data = res?.data?.data || res?.data || res;
        if (typeof data.emiEnabled === 'boolean') {
          setEmiEnabled(data.emiEnabled);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    adminApi.logout();
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'venues':
        return <VenuesPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'users':
        return <UsersPage />;
      case 'vendors':
        return <VendorsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'emi':
        return emiEnabled ? <EMIPage /> : <Dashboard />;
      case 'wedding-plans':
        return <WeddingPlansPage />;
      case 'orders':
        return <OrdersPage />;
      case 'blog':
        return <AdminBlogPage />;
      case 'offers':
        return <AdminOffersPage />;
      case 'chat-support':
        return <ChatSupportPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage onEmiToggle={(enabled) => setEmiEnabled(enabled)} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        emiEnabled={emiEnabled}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;
