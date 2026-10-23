import React from 'react';
import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { adminApi } from '../../services/api';

interface HeaderProps {
  onMenuToggle: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onLogout }) => {
  // Show the signed-in account instead of a fixed name
  const storedUser = adminApi.getStoredUser();
  const displayName = storedUser ? `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim() || storedUser.email : "Admin User";
  const initials = (storedUser
    ? `${storedUser.firstName?.[0] || ""}${storedUser.lastName?.[0] || ""}` || storedUser.email?.[0] || ""
    : "").toUpperCase() || "A";
  const roleLabel = storedUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button aria-label="Notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{initials}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
