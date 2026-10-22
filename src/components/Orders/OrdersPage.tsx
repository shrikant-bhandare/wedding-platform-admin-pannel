import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Loader, ShoppingBag, Clock, CheckCircle, XCircle, Package, Calendar, MapPin, Users, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';

interface Order {
  _id: string;
  bookingRef?: string;
  bookingId?: string;
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
  advanceAmount?: number;
  balanceAmount?: number;
  basePrice?: number;
  gstAmount?: number;
  discountAmount?: number;
  status: string;
  createdAt: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  specialRequests?: string;
  internalNotes?: string;
  addons?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  // Admin cancellations fill `cancellation`; customer cancellations fill cancellationReason/cancelledAt
  cancellation?: {
    cancelledAt: string;
    cancelledBy?: string;
    reason?: string;
  };
  cancellationReason?: string;
  cancelledAt?: string;
}

const OrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);
  const [statusSummary, setStatusSummary] = useState<Record<string, { count: number; totalAmount: number }>>({});
  const ITEMS_PER_PAGE = 10;

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page, limit: ITEMS_PER_PAGE };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await adminApi.getOrders(params);
      // GET /admin/bookings -> { data, total, totalPages, statusSummary }
      const ordersData = response.data?.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setTotalMatching(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);
      setStatusSummary(response.data?.statusSummary || {});
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const handleSearch = () => {
    if (page === 1) loadOrders();
    else setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'REFUNDED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      case 'COMPLETED': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleConfirm = async (order: Order) => {
    setActionLoading(true);
    try {
      await adminApi.confirmOrder(order._id);
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to confirm order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = (order: Order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedOrder || !cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.cancelOrder(selectedOrder._id, cancelReason);
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats: platform-wide totals from the server, not just the current page
  const totalOrders = Object.values(statusSummary).reduce((sum, s) => sum + s.count, 0);
  const pendingOrders = statusSummary.PENDING?.count || 0;
  const confirmedOrders = statusSummary.CONFIRMED?.count || 0;
  const totalRevenue = (statusSummary.CONFIRMED?.totalAmount || 0) + (statusSummary.COMPLETED?.totalAmount || 0);

  // Search, status filter and pagination are applied on the server
  const filteredOrders = orders;
  const paginatedOrders = orders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-500 mt-1">View and manage all booking orders</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={loadOrders} className="text-red-700 hover:text-red-800 flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{confirmedOrders}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ref, name, email, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select aria-label="Status filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.bookingRef || order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.eventType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {order.contactName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A')}
                        </p>
                        <p className="text-xs text-gray-500">{order.contactPhone || order.user?.phone || order.user?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[150px]">{order.venue?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.eventDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">
                        <Users className="w-3 h-3 inline" /> {order.guestCount} guests
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(order)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status?.toUpperCase() === 'PENDING' && (
                          <button onClick={() => handleConfirm(order)} disabled={actionLoading} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Confirm">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {!['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(order.status?.toUpperCase()) && (
                          <button onClick={() => handleCancelConfirm(order)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, totalMatching)} of {totalMatching}
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
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <Modal title="Order Details" isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedOrder(null); }} size="xl">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Reference</p>
                <p className="text-lg font-bold text-gray-900">{selectedOrder.bookingRef || selectedOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                {getStatusIcon(selectedOrder.status)}
                {selectedOrder.status}
              </span>
            </div>

            {/* Grid Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Customer Info
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedOrder.contactName || (selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'N/A')}</span></p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.contactPhone || selectedOrder.user?.phone || 'N/A'}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.contactEmail || selectedOrder.user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Event Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Event Info
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedOrder.eventType}</span></p>
                  <p><span className="text-gray-500">Date:</span> {formatDate(selectedOrder.eventDate)}</p>
                  <p><span className="text-gray-500">Guests:</span> {selectedOrder.guestCount}</p>
                  <p><span className="text-gray-500">Venue:</span> {selectedOrder.venue?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {selectedOrder.basePrice != null && (
                  <div>
                    <p className="text-gray-500">Base Price</p>
                    <p className="font-semibold">{formatCurrency(selectedOrder.basePrice)}</p>
                  </div>
                )}
                {selectedOrder.gstAmount != null && (
                  <div>
                    <p className="text-gray-500">GST (18%)</p>
                    <p className="font-semibold">{formatCurrency(selectedOrder.gstAmount)}</p>
                  </div>
                )}
                {selectedOrder.discountAmount != null && selectedOrder.discountAmount > 0 && (
                  <div>
                    <p className="text-gray-500">Discount</p>
                    <p className="font-semibold text-green-600">-{formatCurrency(selectedOrder.discountAmount)}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Total Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>
              {(selectedOrder.advanceAmount != null || selectedOrder.balanceAmount != null) && (
                <div className="flex gap-6 mt-3 pt-3 border-t border-gray-200 text-sm">
                  {selectedOrder.advanceAmount != null && (
                    <div>
                      <p className="text-gray-500">Advance Paid</p>
                      <p className="font-semibold text-green-600">{formatCurrency(selectedOrder.advanceAmount)}</p>
                    </div>
                  )}
                  {selectedOrder.balanceAmount != null && (
                    <div>
                      <p className="text-gray-500">Balance Due</p>
                      <p className="font-semibold text-red-600">{formatCurrency(selectedOrder.balanceAmount)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Addons */}
            {selectedOrder.addons && selectedOrder.addons.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Add-ons</h4>
                <div className="space-y-2">
                  {selectedOrder.addons.map((addon, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{addon.name} x{addon.quantity}</span>
                      <span className="font-medium">{formatCurrency(addon.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requests */}
            {selectedOrder.specialRequests && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                <p className="text-sm text-gray-600">{selectedOrder.specialRequests}</p>
              </div>
            )}

            {/* Cancellation Info */}
            {(selectedOrder.cancellation || selectedOrder.cancellationReason || selectedOrder.cancelledAt) && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Cancellation Details</h4>
                <p className="text-sm text-red-700">Reason: {selectedOrder.cancellation?.reason || selectedOrder.cancellationReason || 'Not specified'}</p>
                {(selectedOrder.cancellation?.cancelledAt || selectedOrder.cancelledAt) && (
                  <p className="text-sm text-red-600 mt-1">Cancelled: {formatDate((selectedOrder.cancellation?.cancelledAt || selectedOrder.cancelledAt)!)}</p>
                )}
                {selectedOrder.cancellation?.cancelledBy && (
                  <p className="text-sm text-red-600 mt-1">By: {selectedOrder.cancellation.cancelledBy}</p>
                )}
              </div>
            )}

            {/* Status History */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Status History</h4>
                <div className="space-y-2">
                  {selectedOrder.statusHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>{entry.status}</span>
                      <span className="text-gray-500">{formatDate(entry.timestamp)}</span>
                      {entry.note && <span className="text-gray-600">- {entry.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {selectedOrder.status?.toUpperCase() === 'PENDING' && (
                <button
                  onClick={() => { setShowViewModal(false); handleConfirm(selectedOrder); }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" /> Confirm Order
                </button>
              )}
              {!['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(selectedOrder.status?.toUpperCase()) && (
                <button
                  onClick={() => { setShowViewModal(false); handleCancelConfirm(selectedOrder); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel Order
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedOrder && (
        <Modal title="Cancel Order" isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setSelectedOrder(null); }} size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to cancel order <strong>{selectedOrder.bookingRef || selectedOrder._id.slice(-8).toUpperCase()}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter reason for cancellation..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setSelectedOrder(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                Cancel Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrdersPage;
