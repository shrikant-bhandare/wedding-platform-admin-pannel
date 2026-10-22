import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Star, Eye, Trash2, Loader, Check, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { getUploadUrl } from '../../utils/imageUrl';
import AddVenueModal from './AddVenueModal';
import Modal from '../Common/Modal';

interface VenueImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

interface Venue {
  _id: string;
  name: string;
  location: { address?: string; city?: string; state?: string };
  capacity: number;
  minCapacity?: number;
  pricing?: { basePrice: number };
  pricePerDay?: number;
  rating: number;
  totalBookings?: number;
  bookingCount?: number;
  status: string;
  images?: (string | VenueImage)[];
  vendor?: { businessName: string; _id: string } | string;
  venueType?: string;
  description?: string;
  amenities?: Array<{ name: string } | string>;
}

const VenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [vendors, setVendors] = useState<Array<{ _id: string; businessName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const PAGE_SIZE = 20;
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; status?: string; search?: string } = { page, limit: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const [venuesRes, vendorsRes] = await Promise.all([
        adminApi.getVenues(params),
        adminApi.getVendors({ status: 'APPROVED', limit: 1000 })
      ]);
      
      // GET /admin/venues -> { data, total, totalPages, statusCounts }
      const venueData = venuesRes.data?.data || [];
      setVenues(Array.isArray(venueData) ? venueData : []);
      setTotalMatching(venuesRes.data?.total || 0);
      setTotalPages(venuesRes.data?.totalPages || 1);
      setStatusCounts(venuesRes.data?.statusCounts || {});
      
      const vendorData = vendorsRes.data?.data || vendorsRes.data?.vendors || vendorsRes.data || [];
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowViewModal(true);
  };

  const handleDelete = async () => {
    if (!selectedVenue) return;
    setActionLoading('delete');
    try {
      await adminApi.deleteVenue(selectedVenue._id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedVenue(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete venue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (venue: Venue, newStatus: string) => {
    let reason = '';
    if (newStatus !== 'ACTIVE') {
      const input = prompt('Enter rejection reason:');
      if (input === null) return;
      reason = input.trim() || 'Rejected by admin';
    }
    setActionLoading(venue._id);
    try {
      if (newStatus === 'ACTIVE') {
        await adminApi.approveVenue(venue._id);
      } else {
        await adminApi.rejectVenue(venue._id, reason);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update venue status');
    } finally {
      setActionLoading(null);
    }
  };

  const getImageUrl = (venue: Venue): string => {
    const firstImage = venue.images?.[0];
    if (typeof firstImage === 'string') return getUploadUrl(firstImage);
    if (firstImage?.url) return getUploadUrl(firstImage.url);
    return 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Status and search filtering happen on the server
  const filteredVenues = venues;

  const handleSearch = () => {
    if (page === 1) loadData();
    else setPage(1);
  };

  const stats = {
    total: Object.values(statusCounts).reduce((sum, n) => sum + n, 0),
    active: statusCounts.ACTIVE || 0,
    pending: statusCounts.PENDING || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2">Loading venues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} title="Dismiss"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="text-gray-600">Manage all registered venues ({stats.total} total)</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Venue</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Total Venues</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or city (press Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select aria-label="Status filter" 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            title="Filter by status"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVenues.map((venue) => (
          <div key={venue._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative">
              <img 
                src={getImageUrl(venue)} 
                alt={venue.name}
                className="w-full h-40 object-cover"
              />
              <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(venue.status)}`}>
                {venue.status || 'Unknown'}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>
              <div className="flex items-center text-gray-500 text-sm mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {venue.location?.city || 'Location N/A'}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium ml-1">{venue.rating || 0}</span>
                </div>
                <span className="text-sm text-gray-500">{venue.capacity} guests</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-green-600">
                  ₹{(venue.pricing?.basePrice || venue.pricePerDay || 0).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">{venue.bookingCount || venue.totalBookings || 0} bookings</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button 
                  onClick={() => handleView(venue)}
                  title="View venue"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
                {venue.status?.toUpperCase() === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleStatusChange(venue, 'ACTIVE')}
                      title="Approve venue"
                      disabled={actionLoading === venue._id}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      {actionLoading === venue._id ? <Loader className="w-4 h-4 animate-spin text-green-600" /> : <Check className="w-4 h-4 text-green-600" />}
                    </button>
                    <button 
                      onClick={() => handleStatusChange(venue, 'REJECTED')}
                      title="Reject venue"
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setSelectedVenue(venue); setShowDeleteModal(true); }}
                  title="Delete venue"
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredVenues.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No venues found
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalMatching)} of {totalMatching}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
        vendors={vendors}
      />

      {/* View Venue Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Venue Details" size="lg">
        {selectedVenue && (
          <div className="space-y-4">
            <img src={getImageUrl(selectedVenue)} alt={selectedVenue.name} className="w-full h-48 object-cover rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedVenue.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVenue.status)}`}>{selectedVenue.status}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedVenue.location?.city}, {selectedVenue.location?.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium">{selectedVenue.minCapacity || 0} - {selectedVenue.capacity} guests</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price/Day</p>
                <p className="font-medium text-green-600">₹{(selectedVenue.pricing?.basePrice || selectedVenue.pricePerDay || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium flex items-center"><Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />{selectedVenue.rating || 0}</p>
              </div>
              {selectedVenue.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm text-gray-700">{selectedVenue.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Venue" size="sm">
        <div className="text-center">
          <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{selectedVenue?.name}</strong>?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleDelete} disabled={actionLoading === 'delete'} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {actionLoading === 'delete' && <Loader className="w-4 h-4 animate-spin" />}Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VenuesPage;
