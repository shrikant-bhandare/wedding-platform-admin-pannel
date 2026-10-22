import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, Calendar, IndianRupee, Loader, RefreshCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { adminApi } from '../../services/api';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#dc2626', '#0891b2', '#ca8a04'];

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, bookingsRes, venuesRes, paymentsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getBookings({ limit: 500 }).catch(() => null),
        adminApi.getVenues({ limit: 100 }).catch(() => null),
        adminApi.getPayments({ limit: 500 }).catch(() => null),
      ]);

      if (statsRes?.data) setDashboardStats(statsRes.data);

      const bData = bookingsRes?.data?.data || bookingsRes?.data?.bookings || bookingsRes?.data || [];
      setBookings(Array.isArray(bData) ? bData : []);

      const vData = venuesRes?.data?.data || venuesRes?.data?.venues || venuesRes?.data || [];
      setVenues(Array.isArray(vData) ? vData : []);

      const pData = paymentsRes?.data?.payments || paymentsRes?.data || [];
      setPayments(Array.isArray(pData) ? pData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  // Only money actually received counts as revenue (not PENDING/FAILED/REFUNDED payments)
  const completedPayments = payments.filter((p: any) => p.status?.toUpperCase() === 'COMPLETED');

  // Compute key metrics
  const totalRevenue = dashboardStats?.totalRevenue || completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalBookingsCount = dashboardStats?.totalBookings || bookings.length;
  const avgBookingValue = totalBookingsCount > 0 ? Math.round(totalRevenue / totalBookingsCount) : 0;
  const confirmedCount = bookings.filter((b: any) => ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase())).length;
  const conversionRate = totalBookingsCount > 0 ? ((confirmedCount / totalBookingsCount) * 100).toFixed(1) : '0';

  // Monthly revenue from payments data
  const monthlyRevenue = (() => {
    const monthMap: Record<string, { key: string; revenue: number }> = {};
    completedPayments.forEach((p: any) => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      if (!monthMap[sortKey]) monthMap[sortKey] = { key: label, revenue: 0 };
      monthMap[sortKey].revenue += (p.amount || 0);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, val]) => ({ month: val.key, revenue: val.revenue }));
  })();

  // Event type distribution from bookings
  const bookingsByEventType = (() => {
    const typeMap: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const type = b.eventType || 'Other';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    return Object.entries(typeMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }));
  })();

  // City-wise bookings
  const cityWiseBookings = (() => {
    const cityMap: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const city = b.venue?.location?.city || 'Unknown';
      if (city !== 'Unknown') cityMap[city] = (cityMap[city] || 0) + 1;
    });
    return Object.entries(cityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([city, count]) => ({ city, bookings: count }));
  })();

  // Top venues by revenue
  const topVenues = (() => {
    const venueMap: Record<string, { name: string; bookings: number; revenue: number }> = {};
    bookings.forEach((b: any) => {
      const id = b.venue?._id || 'unknown';
      const name = b.venue?.name || 'Unknown Venue';
      if (id === 'unknown') return;
      if (!venueMap[id]) venueMap[id] = { name, bookings: 0, revenue: 0 };
      venueMap[id].bookings++;
      if (['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase())) {
        venueMap[id].revenue += b.totalAmount || 0;
      }
    });
    venues.forEach((v: any) => {
      const id = v._id;
      if (!venueMap[id]) {
        venueMap[id] = { name: v.name, bookings: v.bookingCount || v.totalBookings || 0, revenue: 0 };
      }
    });
    return Object.values(venueMap)
      .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
      .slice(0, 5);
  })();

  const formatLakh = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  const handleExport = () => {
    const lines = [
      'SOHALAA Analytics Report',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'KEY METRICS',
      `Total Revenue,${totalRevenue}`,
      `Total Bookings,${totalBookingsCount}`,
      `Avg Booking Value,${avgBookingValue}`,
      `Conversion Rate,${conversionRate}%`,
      '',
      'MONTHLY REVENUE',
      'Month,Revenue',
      ...monthlyRevenue.map(m => `${m.month},${m.revenue}`),
      '',
      'EVENT TYPE DISTRIBUTION',
      'Type,Count',
      ...bookingsByEventType.map(e => `${e.name},${e.value}`),
      '',
      'CITY-WISE BOOKINGS',
      'City,Bookings',
      ...cityWiseBookings.map(c => `${c.city},${c.bookings}`),
      '',
      'TOP VENUES',
      'Venue,Bookings,Revenue',
      ...topVenues.map(v => `${v.name},${v.bookings},${v.revenue}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sohalaa-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadReportData}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2 border border-gray-300"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadReportData}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              {dashboardStats?.revenueGrowth ? `+${dashboardStats.revenueGrowth}%` : '--'}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{formatLakh(totalRevenue)}</p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              {dashboardStats?.bookingGrowth ? `+${dashboardStats.bookingGrowth}%` : '--'}
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{totalBookingsCount.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Bookings</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 rounded-lg">
              <IndianRupee className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              --
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{formatLakh(avgBookingValue)}</p>
          <p className="text-sm text-gray-600">Avg. Booking Value</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`flex items-center text-sm ${Number(conversionRate) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {Number(conversionRate) >= 50 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {conversionRate}%
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-3">{conversionRate}%</p>
          <p className="text-sm text-gray-600">Conversion Rate</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: number) => [`₹${(value / 100000).toFixed(1)}L`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No revenue data available
            </div>
          )}
        </div>

        {/* Bookings by Event Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Event Type</h3>
          {bookingsByEventType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingsByEventType}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bookingsByEventType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No booking data available
            </div>
          )}
        </div>
      </div>

      {/* City-wise Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">City-wise Bookings</h3>
        {cityWiseBookings.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityWiseBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="city" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="bookings" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            No city data available
          </div>
        )}
      </div>

      {/* Top Venues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Venues</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topVenues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No venue data available
                  </td>
                </tr>
              ) : (
                topVenues.map((venue, index) => (
                  <tr key={venue.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venue.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{venue.bookings}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatLakh(venue.revenue)}</td>
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

export default ReportsPage;
