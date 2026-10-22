import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Calendar, Loader, Users, MapPin, CreditCard } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';

interface Booking {
  _id: string;
  bookingRef?: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  venue?: {
    _id: string;
    name: string;
    location?: {
      address?: string;
      city?: string;
    };
  };
  eventDate: string;
  eventType: string;
  guestCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  specialRequests?: string;
  addons?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

const BookingsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);
  const [statusSummary, setStatusSummary] = useState<Record<string, { count: number }>>({});
  const PAGE_SIZE = 20;
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const params: { page: number; limit: number; status?: string; search?: string } = { page, limit: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await adminApi.getBookings(params);
      // GET /admin/bookings -> { data, total, totalPages, statusSummary }
      const bookingsData = response.data?.data || [];
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTotalMatching(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setStatusSummary(response.data?.statusSummary || {});
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, statusFilter]);

  const handleSearch = () => {
    if (page === 1) loadBookings();
    else setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const handleConfirm = async (booking: Booking) => {
    setActionLoading(true);
    try {
      await adminApi.updateBookingStatus(booking._id, 'CONFIRMED');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason');
      return;
    }
    
    setActionLoading(true);
    try {
      await adminApi.cancelBooking(selectedBooking._id, cancelReason);
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getBookingDisplayId = (booking: Booking) => {
    return booking.bookingRef || `BK${booking._id.slice(-6).toUpperCase()}`;
  };

  // Search and status are filtered on the server; the date filter narrows the loaded page
  const filteredBookings = bookings.filter(booking =>
    dateFilter === '' || booking.eventDate.startsWith(dateFilter)
  );

  // Stats: platform-wide totals from the server
  const stats = {
    total: Object.values(statusSummary).reduce((sum, s) => sum + s.count, 0),
    confirmed: statusSummary.CONFIRMED?.count || 0,
    pending: statusSummary.PENDING?.count || 0,
    cancelled: statusSummary.CANCELLED?.count || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600">Manage all venue bookings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID, customer name, venue (press Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Status filter" 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">{getBookingDisplayId(booking)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.user ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.user.firstName} {booking.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{booking.user.phone || booking.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.venue?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(booking.eventDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {booking.eventType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(booking.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleView(booking)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {booking.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleConfirm(booking)}
                              className="p-1 hover:bg-green-100 rounded"
                              title="Confirm"
                              disabled={actionLoading}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button 
                              onClick={() => handleCancelClick(booking)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Cancel"
                              disabled={actionLoading}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                        {booking.status?.toUpperCase() === 'CONFIRMED' && (
                          <button 
                            onClick={() => handleCancelClick(booking)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Cancel Booking"
                            disabled={actionLoading}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalMatching)} of {totalMatching}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 border rounded-lg text-sm hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Booking Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-600">
                  {getBookingDisplayId(selectedBooking)}
                </h3>
                <p className="text-sm text-gray-500">Created: {formatDate(selectedBooking.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" /> Customer Details
                </h4>
                {selectedBooking.user ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedBooking.user.firstName} {selectedBooking.user.lastName}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedBooking.user.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedBooking.user.phone || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Customer info not available</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Venue Details
                </h4>
                {selectedBooking.venue ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Venue:</span> {selectedBooking.venue.name}</p>
                    <p><span className="text-gray-500">Location:</span> {selectedBooking.venue.location?.city || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Venue info not available</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> Event Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Event Date:</span> {formatDate(selectedBooking.eventDate)}</p>
                  <p><span className="text-gray-500">Event Type:</span> {selectedBooking.eventType || 'N/A'}</p>
                  <p><span className="text-gray-500">Guest Count:</span> {selectedBooking.guestCount || 0}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" /> Payment Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Total Amount:</span> <strong className="text-green-600">₹{(selectedBooking.totalAmount || 0).toLocaleString()}</strong></p>
                </div>
              </div>
            </div>

            {selectedBooking.addons && selectedBooking.addons.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Selected Add-ons</h4>
                <div className="space-y-2">
                  {selectedBooking.addons.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name || 'Add-on'} x{item.quantity}</span>
                      <span>₹{(item.totalPrice ?? (item.unitPrice || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBooking.specialRequests && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedBooking.specialRequests}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">Booking ID: {selectedBooking._id}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel booking <strong>{selectedBooking && getBookingDisplayId(selectedBooking)}</strong>?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={handleCancel}
              disabled={actionLoading || !cancelReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {actionLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Booking
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingsPage;
