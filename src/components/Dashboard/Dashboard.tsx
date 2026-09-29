import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Users,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Loader
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminApi } from '../../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load dashboard stats and recent bookings in parallel
      const [statsResponse, bookingsResponse] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getBookings({ limit: 5 }).catch(() => null)
      ]);
      
      if (statsResponse?.data) {
        setDashboardData(statsResponse.data);
      }
      // Handle bookings - could be array or object with data/bookings property
      if (bookingsResponse?.data) {
        const bookings = Array.isArray(bookingsResponse.data) 
          ? bookingsResponse.data 
          : bookingsResponse.data.data || bookingsResponse.data.bookings || [];
        setRecentBookings(bookings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: 'Total Revenue', 
      value: dashboardData?.totalRevenue ? `₹${dashboardData.totalRevenue.toLocaleString()}` : '₹0', 
      change: '+12.5%', 
      isPositive: true,
      icon: IndianRupee,
      color: 'bg-green-500'
    },
    { 
      title: 'Total Bookings', 
      value: dashboardData?.totalBookings?.toString() || String(recentBookings.length), 
      change: '+8.2%', 
      isPositive: true,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    { 
      title: 'Active Venues', 
      value: (dashboardData?.totalVenues || dashboardData?.activeVenues || 0).toString(), 
      change: '+5.1%', 
      isPositive: true,
      icon: Building2,
      color: 'bg-purple-500'
    },
    { 
      title: 'Total Users', 
      value: dashboardData?.totalUsers?.toString() || '0', 
      change: '+3.2%', 
      isPositive: true,
      icon: Users,
      color: 'bg-orange-500'
    },
  ];

  const revenueData = dashboardData?.revenueData || [
    { month: 'Jan', revenue: 320000 },
    { month: 'Feb', revenue: 450000 },
    { month: 'Mar', revenue: 380000 },
    { month: 'Apr', revenue: 520000 },
    { month: 'May', revenue: 480000 },
    { month: 'Jun', revenue: 620000 },
    { month: 'Jul', revenue: 580000 },
  ];

  const bookingsData = dashboardData?.bookingsData || [
    { day: 'Mon', bookings: 45 },
    { day: 'Tue', bookings: 52 },
    { day: 'Wed', bookings: 38 },
    { day: 'Thu', bookings: 65 },
    { day: 'Fri', bookings: 78 },
    { day: 'Sat', bookings: 92 },
    { day: 'Sun', bookings: 85 },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadDashboardData}
            className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="bookings" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking._id || booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(booking._id || booking.id)?.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.venue?.name || booking.venueName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.user?.name || (booking.user?.firstName ? `${booking.user.firstName} ${booking.user.lastName || ''}`.trim() : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(booking.eventDate || booking.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
