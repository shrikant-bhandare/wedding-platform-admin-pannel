import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, CheckCircle, Clock, XCircle, Loader, RefreshCcw } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';

interface Payment {
  _id: string;
  paymentId?: string;
  booking?: {
    _id: string;
    bookingId?: string;
  };
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  vendor?: {
    _id: string;
    businessName: string;
  };
  amount: number;
  platformFee?: number;
  vendorAmount?: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  transactionId?: string;
}

const PaymentsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getPayments();
      const paymentsData = response.data?.payments || response.data || response.payments || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REFUNDED':
      case 'FAILED': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentDisplayId = (payment: Payment) => {
    return payment.paymentId || `PAY${payment._id.slice(-6).toUpperCase()}`;
  };

  const getBookingDisplayId = (payment: Payment) => {
    if (payment.booking?.bookingId) return payment.booking.bookingId;
    if (payment.booking?._id) return `BK${payment.booking._id.slice(-6).toUpperCase()}`;
    return 'N/A';
  };

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Payment ID', 'Booking ID', 'Customer', 'Vendor', 'Amount', 'Platform Fee', 'Method', 'Status', 'Date'];
    const rows = payments.map(p => [
      getPaymentDisplayId(p),
      getBookingDisplayId(p),
      p.user ? `${p.user.firstName} ${p.user.lastName}` : 'N/A',
      p.vendor?.businessName || 'N/A',
      p.amount,
      p.platformFee || 0,
      p.paymentMethod || 'N/A',
      p.status,
      formatDate(p.createdAt)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const displayId = getPaymentDisplayId(payment);
    const bookingId = getBookingDisplayId(payment);
    const customerName = payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : '';
    
    const matchesSearch = searchQuery === '' || 
      displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      payment.status?.toUpperCase() === statusFilter.toUpperCase();
    
    const matchesMethod = methodFilter === '' || 
      payment.paymentMethod?.toUpperCase() === methodFilter.toUpperCase();
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Stats
  const stats = {
    totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    platformFees: payments.reduce((sum, p) => sum + (p.platformFee || 0), 0),
    vendorPayouts: payments.reduce((sum, p) => sum + (p.vendorAmount || 0), 0),
    pending: payments.filter(p => p.status?.toUpperCase() === 'PENDING').reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track all payment transactions</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={loadPayments}
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
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Platform Fees</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.platformFees)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Vendor Payouts</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.vendorPayouts)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by payment ID, booking ID, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
            <select 
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="EMI">EMI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {getPaymentDisplayId(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {getBookingDisplayId(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.vendor?.businessName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(payment.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₹{(payment.platformFee || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleView(payment)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Payment Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Payment Details"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-600">
                  {getPaymentDisplayId(selectedPayment)}
                </h3>
                <p className="text-sm text-gray-500">{formatDate(selectedPayment.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full inline-flex items-center gap-1 ${getStatusColor(selectedPayment.status)}`}>
                {getStatusIcon(selectedPayment.status)}
                {selectedPayment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Booking ID</p>
                <p className="font-medium text-blue-600">{getBookingDisplayId(selectedPayment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{selectedPayment.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedPayment.user 
                    ? `${selectedPayment.user.firstName} ${selectedPayment.user.lastName}` 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendor</p>
                <p className="font-medium">{selectedPayment.vendor?.businessName || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">₹{(selectedPayment.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="text-green-600">₹{(selectedPayment.platformFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Vendor Payout</span>
                <span className="font-semibold text-blue-600">
                  ₹{(selectedPayment.vendorAmount || (selectedPayment.amount - (selectedPayment.platformFee || 0)) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedPayment.transactionId && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm">{selectedPayment.transactionId}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">Payment ID: {selectedPayment._id}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
