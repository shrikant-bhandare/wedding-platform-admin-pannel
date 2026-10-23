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
    <div className={`relative bloom bloom-quiet bg-ink-950 text-ivory transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className={`flex border-b border-gold-500/25 ${isOpen ? 'items-center justify-between p-4' : 'flex-col items-center gap-3 py-4'}`}>
        <div className="flex items-center">
          {isOpen ? (
            <img src="/brand/logo-light.webp" alt="Sohalaa" width={720} height={242} className="h-12 w-auto" />
          ) : (
            <img src="/brand/icon-48.png" alt="Sohalaa" width={40} height={40} className="w-10 h-10 rounded-lg flex-shrink-0" />
          )}
        </div>
        <button 
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Badge */}
      {isOpen && (
        <div className="px-4 py-2">
          <span className="ring-1 ring-gold-500/50 text-gold-300 text-xs tracking-[0.18em] px-2 py-1 rounded">ADMIN PANEL</span>
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
                  ? 'bg-white/10 text-gold-300' 
                  : 'text-ink-100 hover:bg-white/5 hover:text-white'
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
