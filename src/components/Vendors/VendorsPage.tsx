import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Mail, Phone, Building2, Plus, Loader, ClipboardList } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';
import AddVendorModal from './AddVendorModal';
import VendorEnquiriesPage from '../Enquiries/VendorEnquiriesPage';

interface Vendor {
  _id: string;
  businessName: string;
  businessType?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  statistics?: {
    totalVenues?: number;
    totalBookings?: number;
    totalRevenue?: number;
  };
}

const VendorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vendors' | 'enquiries'>('vendors');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getVendors({ limit: 1000 });
      const vendorsData = response.data?.data || response.data?.vendors || response.data || response.vendors || [];
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (err: any) {
      console.error('Error loading vendors:', err);
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
      case 'SUSPENDED':
      case 'INACTIVE': return 'bg-red-100 text-red-800';
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

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleApprove = async (vendor: Vendor) => {
    setActionLoading(true);
    try {
      await adminApi.approveVendor(vendor._id);
      loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vendor: Vendor) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      await adminApi.rejectVendor(vendor._id, reason);
      loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (vendor: Vendor) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;
    
    setActionLoading(true);
    try {
      await adminApi.suspendVendor(vendor._id, reason);
      loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend vendor');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = searchQuery === '' || 
      vendor.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      vendor.status?.toUpperCase() === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status?.toUpperCase() === 'APPROVED' || v.status?.toUpperCase() === 'ACTIVE').length,
    pending: vendors.filter(v => v.status?.toUpperCase() === 'PENDING').length,
    totalVenues: vendors.reduce((sum, v) => sum + (v.statistics?.totalVenues || 0), 0),
  };

  if (loading && activeTab === 'vendors') {
    return (
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'vendors' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" /> Vendors
            </button>
            <button
              onClick={() => setActiveTab('enquiries')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'enquiries' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Enquiries
            </button>
          </nav>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading vendors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'vendors' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" /> Vendors
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'enquiries' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Enquiries
          </button>
        </nav>
      </div>

      {activeTab === 'enquiries' ? (
        <VendorEnquiriesPage />
      ) : (
      <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage venue vendors and partners</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vendor</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadVendors}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Vendors</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Active Vendors</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Venues</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalVenues}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
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
              <option value="APPROVED">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          No vendors found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{vendor.businessName || 'Unknown Business'}</h3>
                    <p className="text-sm text-gray-500">
                      {(vendor.userId || vendor.user) ? `${(vendor.userId || vendor.user)?.firstName} ${(vendor.userId || vendor.user)?.lastName}` : 'Owner N/A'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                  {vendor.status || 'Unknown'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {vendor.contactEmail || vendor.userId?.email || vendor.user?.email || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {vendor.contactPhone || vendor.userId?.phone || vendor.user?.phone || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{vendor.statistics?.totalVenues || 0}</p>
                  <p className="text-xs text-gray-500">Venues</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{vendor.statistics?.totalBookings || 0}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(vendor.statistics?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">Joined: {formatDate(vendor.createdAt)}</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleView(vendor)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  {vendor.status?.toUpperCase() === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleApprove(vendor)}
                        className="p-2 hover:bg-green-100 rounded-lg"
                        title="Approve"
                        disabled={actionLoading}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button 
                        onClick={() => handleReject(vendor)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                        title="Reject"
                        disabled={actionLoading}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                  {vendor.status?.toUpperCase() === 'APPROVED' && (
                    <button 
                      onClick={() => handleSuspend(vendor)}
                      className="p-2 hover:bg-red-100 rounded-lg"
                      title="Suspend"
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      <AddVendorModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadVendors}
      />

      {/* View Vendor Modal */}
      <Modal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedVendor.businessName}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVendor.status)}`}>
                  {selectedVendor.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Owner Name</p>
                <p className="font-medium">
                  {(selectedVendor.userId || selectedVendor.user) ? `${(selectedVendor.userId || selectedVendor.user)?.firstName} ${(selectedVendor.userId || selectedVendor.user)?.lastName}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Business Type</p>
                <p className="font-medium">{selectedVendor.businessType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Email</p>
                <p className="font-medium">{selectedVendor.contactEmail || selectedVendor.userId?.email || selectedVendor.user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Phone</p>
                <p className="font-medium">{selectedVendor.contactPhone || selectedVendor.userId?.phone || selectedVendor.user?.phone || 'N/A'}</p>
              </div>
            </div>

            {selectedVendor.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{selectedVendor.description}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedVendor.statistics?.totalVenues || 0}</p>
                <p className="text-sm text-gray-500">Venues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedVendor.statistics?.totalBookings || 0}</p>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedVendor.statistics?.totalRevenue || 0)}
                </p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>

            {selectedVendor.bankDetails && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Bank Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-medium">{selectedVendor.bankDetails.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-medium">{selectedVendor.bankDetails.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">IFSC Code</p>
                    <p className="font-medium">{selectedVendor.bankDetails.ifscCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">Vendor ID</p>
              <p className="font-mono text-xs">{selectedVendor._id}</p>
            </div>
          </div>
        )}
      </Modal>
      </>
      )}
    </div>
  );
};

export default VendorsPage;
