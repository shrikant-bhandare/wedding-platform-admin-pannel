import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Eye,
  Loader,
  RefreshCcw,
  Building2,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  CreditCard
} from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';

interface EMIPayment {
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
    email?: string;
    phone?: string;
  };
  venue?: {
    _id: string;
    name: string;
  };
  amount: number;
  emiDetails?: {
    bankName: string;
    tenure: number;
    interestRate: number;
    monthlyEMI: number;
    totalAmount: number;
    processingFee: number;
  };
  status: string;
  createdAt: string;
}

interface EMIPartner {
  bankName: string;
  bankCode: string;
  tenures: number[];
  interestRate: number;
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

const EMIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'partners' | 'analytics'>('payments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emiPayments, setEmiPayments] = useState<EMIPayment[]>([]);
  const [emiPartners, setEmiPartners] = useState<EMIPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState<EMIPayment | null>(null);

  const loadEMIData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load EMI payments (payments with method=EMI)
      const paymentsResponse = await adminApi.getPayments();
      const allPayments = paymentsResponse.data?.payments || paymentsResponse.payments || [];
      const emiOnly = allPayments.filter((p: any) => p.paymentMethod === 'EMI');
      setEmiPayments(emiOnly);
      
      // Load EMI partners from settings
      const settingsResponse = await adminApi.getSettings();
      const settings = settingsResponse.data?.settings || settingsResponse.settings || settingsResponse.data || {};
      setEmiPartners(settings.emiPartners || []);
      
    } catch (err: any) {
      console.error('Error loading EMI data:', err);
      setError(err.message || 'Failed to load EMI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEMIData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PROCESSING': return <Loader className="w-4 h-4 animate-spin" />;
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  // Filter EMI payments
  const filteredPayments = emiPayments.filter(payment => {
    const customerName = payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : '';
    const matchesSearch = searchQuery === '' || 
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.emiDetails?.bankName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      payment.status?.toUpperCase() === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    totalEMIs: emiPayments.length,
    totalValue: emiPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    activePartners: emiPartners.filter(p => p.isActive).length,
    avgTenure: emiPayments.length > 0 
      ? Math.round(emiPayments.reduce((sum, p) => sum + (p.emiDetails?.tenure || 0), 0) / emiPayments.length)
      : 0,
  };

  const handleView = (payment: EMIPayment) => {
    setSelectedEMI(payment);
    setShowViewModal(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Payment ID', 'Customer', 'Bank', 'Tenure', 'Amount', 'Monthly EMI', 'Status', 'Date'].join(','),
      ...filteredPayments.map(p => [
        p.paymentId || p._id,
        p.user ? `${p.user.firstName} ${p.user.lastName}` : 'N/A',
        p.emiDetails?.bankName || 'N/A',
        `${p.emiDetails?.tenure || 0} months`,
        p.amount,
        p.emiDetails?.monthlyEMI || 0,
        p.status,
        formatDate(p.createdAt),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emi-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading EMI data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EMI Management</h1>
          <p className="text-gray-600">Track EMI payments and manage bank partners</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={loadEMIData}
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadEMIData}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total EMI Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEMIs}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total EMI Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Bank Partners</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activePartners}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg EMI Tenure</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgTenure} months</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'payments', label: 'EMI Payments', icon: CreditCard },
              { id: 'partners', label: 'Bank Partners', icon: Building2 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* EMI Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by customer or bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select aria-label="Status filter" 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* EMI Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly EMI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No EMI payments found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {payment.user ? (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {payment.user.firstName} {payment.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{payment.user.phone || payment.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {(payment.emiDetails?.bankName || 'NA').slice(0, 2)}
                              </div>
                              <span className="text-sm text-gray-900">{payment.emiDetails?.bankName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {payment.emiDetails?.tenure || 0} months
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600 font-medium">
                            {formatCurrency(payment.emiDetails?.monthlyEMI || 0)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-4 py-3">
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
          )}

          {/* Bank Partners Tab */}
          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emiPartners.map((partner) => (
                  <div 
                    key={partner.bankCode} 
                    className={`p-4 rounded-lg border-2 ${
                      partner.isActive 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {partner.bankCode.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{partner.bankName}</h4>
                          <p className="text-xs text-gray-500">{partner.bankCode}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        partner.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-medium text-gray-900">{partner.interestRate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Processing Fee</p>
                        <p className="font-medium text-gray-900">{partner.processingFee}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tenures</p>
                        <p className="font-medium text-gray-900">{partner.tenures.map(t => `${t}M`).join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount Range</p>
                        <p className="font-medium text-gray-900 text-xs">
                          ₹{(partner.minAmount / 1000)}K - ₹{(partner.maxAmount / 1000)}K
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {emiPartners.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No EMI partners configured</p>
                  <p className="text-sm">Go to Settings → EMI & Partners to add bank partners</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* EMI Distribution by Bank */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">EMI Distribution by Bank</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emiPartners.filter(p => p.isActive).map((partner) => {
                    const bankPayments = emiPayments.filter(
                      p => p.emiDetails?.bankName === partner.bankName
                    );
                    const bankTotal = bankPayments.reduce((sum, p) => sum + p.amount, 0);
                    const percentage = stats.totalValue > 0 
                      ? Math.round((bankTotal / stats.totalValue) * 100) 
                      : 0;
                    
                    return (
                      <div key={partner.bankCode} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{partner.bankName}</span>
                          <span className="text-sm text-gray-600">{bankPayments.length} EMIs</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{percentage}% of total</span>
                          <span className="font-medium text-gray-900">{formatCurrency(bankTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tenure Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">EMI by Tenure</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[3, 6, 9, 12].map((tenure) => {
                    const tenurePayments = emiPayments.filter(
                      p => p.emiDetails?.tenure === tenure
                    );
                    return (
                      <div key={tenure} className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-700">{tenurePayments.length}</p>
                        <p className="text-sm text-purple-600">{tenure} Months</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <h4 className="font-medium mb-4">EMI Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-green-100 text-sm">Total EMI Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Total EMI Count</p>
                    <p className="text-2xl font-bold">{stats.totalEMIs}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Avg EMI Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalEMIs > 0 ? Math.round(stats.totalValue / stats.totalEMIs) : 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Active Partners</p>
                    <p className="text-2xl font-bold">{stats.activePartners}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedEMI && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title="EMI Payment Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedEMI.user 
                    ? `${selectedEMI.user.firstName} ${selectedEMI.user.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">
                  {selectedEMI.user?.phone || selectedEMI.user?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bank</p>
                <p className="font-medium">{selectedEMI.emiDetails?.bankName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenure</p>
                <p className="font-medium">{selectedEMI.emiDetails?.tenure || 0} months</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Principal Amount</p>
                <p className="font-medium">{formatCurrency(selectedEMI.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Interest Rate</p>
                <p className="font-medium">{selectedEMI.emiDetails?.interestRate || 0}% p.a.</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly EMI</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(selectedEMI.emiDetails?.monthlyEMI || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Payable</p>
                <p className="font-medium">
                  {formatCurrency(selectedEMI.emiDetails?.totalAmount || selectedEMI.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Processing Fee</p>
                <p className="font-medium">
                  {formatCurrency(selectedEMI.emiDetails?.processingFee || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEMI.status)}`}>
                  {selectedEMI.status}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EMIPage;
