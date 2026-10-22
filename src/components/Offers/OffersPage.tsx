import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Gift, Star, Loader, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';
import CreateOfferModal from './CreateOfferModal';

const AdminOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [viewOffer, setViewOffer] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchOffers = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await adminApi.getOffers(params);
      const data = res?.data || res;
      setOffers(data?.data || []);
      setPagination({
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
        total: data?.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [searchQuery, statusFilter, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await adminApi.deleteOffer(id);
      fetchOffers(pagination.page);
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  };

  const handleEdit = (offer: any) => {
    setEditData(offer);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700';
      case 'EXPIRED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FEATURED_DEAL: 'Featured Deal',
      SEASONAL: 'Seasonal',
      REFERRAL: 'Referral',
      EARLY_BIRD: 'Early Bird',
      WEEKEND: 'Weekend',
      CUSTOM: 'Custom',
    };
    return labels[type] || type;
  };

  const stats = {
    total: pagination.total,
    active: offers.filter(o => o.status === 'ACTIVE').length,
    drafts: offers.filter(o => o.status === 'DRAFT').length,
    featured: offers.filter(o => o.featured).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Deals</h1>
          <p className="text-gray-500 mt-1">Manage promotional offers for the platform</p>
        </div>
        <button
          onClick={() => { setEditData(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Create Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Offers', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Drafts', value: stats.drafts, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Featured', value: stats.featured, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select aria-label="Status filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select aria-label="Type filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Types</option>
          <option value="FEATURED_DEAL">Featured Deal</option>
          <option value="SEASONAL">Seasonal</option>
          <option value="REFERRAL">Referral</option>
          <option value="EARLY_BIRD">Early Bird</option>
          <option value="WEEKEND">Weekend</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <button
          onClick={() => fetchOffers(pagination.page)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No offers found</p>
            <p className="text-sm">Create your first offer to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Offer</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Valid Till</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map((offer) => (
                <tr key={offer._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${offer.gradient || 'from-emerald-500 to-teal-500'} flex items-center justify-center`}>
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {offer.title}
                          {offer.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">{offer.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{getTypeLabel(offer.type)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {offer.originalPrice ? (
                      <div>
                        <span className="text-sm text-gray-400 line-through">₹{offer.originalPrice.toLocaleString()}</span>
                        {offer.discountedPrice && (
                          <span className="text-sm font-medium text-emerald-600 ml-2">₹{offer.discountedPrice.toLocaleString()}</span>
                        )}
                      </div>
                    ) : offer.discountPercent ? (
                      <span className="text-sm font-medium text-emerald-600">{offer.discountPercent}% OFF</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewOffer(offer)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(offer)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(offer._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOffers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchOffers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setViewOffer(null)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6">
                <div className={`w-full h-32 rounded-xl bg-gradient-to-r ${viewOffer.gradient || 'from-emerald-500 to-teal-500'} flex items-center justify-center mb-4`}>
                  <Gift className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {viewOffer.title}
                  {viewOffer.featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                </h3>
                <p className="text-gray-600 mt-2">{viewOffer.description}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{getTypeLabel(viewOffer.type)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewOffer.status)}`}>{viewOffer.status}</span>
                  </div>
                  {viewOffer.originalPrice && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500">Original Price</p>
                      <p className="font-medium">₹{viewOffer.originalPrice.toLocaleString()}</p>
                    </div>
                  )}
                  {viewOffer.discountedPrice && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500">Discounted Price</p>
                      <p className="font-medium text-emerald-600">₹{viewOffer.discountedPrice.toLocaleString()}</p>
                    </div>
                  )}
                  {viewOffer.couponCode && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500">Coupon Code</p>
                      <p className="font-mono font-medium">{viewOffer.couponCode}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Valid Period</p>
                    <p className="font-medium text-xs">
                      {new Date(viewOffer.validFrom).toLocaleDateString()} – {new Date(viewOffer.validTill).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setViewOffer(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { handleEdit(viewOffer); setViewOffer(null); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateOfferModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditData(null); }}
        onSuccess={() => fetchOffers(pagination.page)}
        editData={editData}
      />
    </div>
  );
};

export default AdminOffersPage;
