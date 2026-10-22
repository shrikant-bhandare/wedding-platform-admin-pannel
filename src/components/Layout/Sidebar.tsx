import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Users, 
  Store, 
  CreditCard,
  Banknote,
  Heart,
  BarChart3, 
  Settings,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  FileText,
  Gift,
  MessageCircle
} from 'lucide-react';

type PageType = 'dashboard' | 'venues' | 'bookings' | 'users' | 'vendors' | 'payments' | 'emi' | 'wedding-plans' | 'orders' | 'blog' | 'offers' | 'chat-support' | 'reports' | 'settings';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: PageType) => void;
  isOpen: boolean;
  onToggle: () => void;
  emiEnabled?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onToggle, emiEnabled }) => {
  const allMenuItems: { id: PageType; label: string; icon: any; emiOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'venues', label: 'Venues', icon: Building2 },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'wedding-plans', label: 'Wedding Plans', icon: Heart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'emi', label: 'EMI', icon: Banknote, emiOnly: true },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'offers', label: 'Offers & Deals', icon: Gift },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'chat-support', label: 'Chat Support', icon: MessageCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const menuItems = allMenuItems.filter(item => !item.emiOnly || emiEnabled);

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <MapPin className="w-8 h-8 text-green-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          {isOpen && <span className="text-xl font-bold">WEDVEN</span>}
        </div>
        <button 
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Badge */}
      {isOpen && (
        <div className="px-4 py-2">
          <span className="bg-green-600 text-xs font-medium px-2 py-1 rounded">ADMIN PANEL</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              title={isOpen ? undefined : item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                isActive 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span className="ml-3">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
