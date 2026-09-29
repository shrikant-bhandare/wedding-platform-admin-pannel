import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, Heart, Calendar, Loader, Users, MapPin, Palette, Timer, IndianRupee } from 'lucide-react';
import { adminApi } from '../../services/api';
import Modal from '../Common/Modal';

interface WeddingPlan {
  _id: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  brideName: string;
  groomName: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  city: string;
  budget: number;
  theme?: string;
  colorScheme?: string;
  venueId?: {
    _id: string;
    name: string;
    location?: {
      city?: string;
    };
  };
  services: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }>;
  addons: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  timelineItems?: Array<{
    time: string;
    event: string;
    description?: string;
  }>;
}

interface Stats {
  totalPlans: number;
  statusBreakdown: Record<string, number>;
  totalRevenue: number;
  avgBudget: number;
  topCities: Array<{ city: string; count: number }>;
  topEventTypes: Array<{ eventType: string; count: number }>;
}

const WeddingPlansPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plans, setPlans] = useState<WeddingPlan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WeddingPlan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const [plansResponse, statsResponse] = await Promise.all([
        adminApi.getWeddingPlans(),
        adminApi.getWeddingPlanStats()
      ]);
      
      const plansData = plansResponse.data?.data || plansResponse.data?.plans || plansResponse.data || [];
      setPlans(Array.isArray(plansData) ? plansData : []);
      
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err: any) {
      console.error('Error loading wedding plans:', err);
      setError(err.message || 'Failed to load wedding plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED': return 'bg-purple-100 text-purple-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-teal-100 text-teal-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleView = (plan: WeddingPlan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const handleConfirm = async (plan: WeddingPlan) => {
    if (plan.status === 'CONFIRMED' || plan.status === 'COMPLETED') {
      alert('This plan is already confirmed/completed');
      return;
    }
    
    setActionLoading(true);
    try {
      await adminApi.confirmWeddingPlan(plan._id);
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm wedding plan');
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanDisplayId = (plan: WeddingPlan) => {
    return `WP${plan._id.slice(-6).toUpperCase()}`;
  };

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const displayId = getPlanDisplayId(plan);
    const coupleNames = `${plan.brideName} ${plan.groomName}`;
    const customerName = plan.userId ? `${plan.userId.firstName} ${plan.userId.lastName}` : '';
    
    const matchesSearch = searchQuery === '' || 
      displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupleNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      plan.status?.toUpperCase() === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wedding Plans</h1>
        <p className="text-gray-600 mt-1">Manage customer wedding plans and packages</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Plans</p>
                <p className="text-xl font-bold">{stats.totalPlans}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Palette className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Budget</p>
                <p className="text-xl font-bold">{formatCurrency(stats.avgBudget)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-xl font-bold">{stats.statusBreakdown?.CONFIRMED || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, couple names, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
        <select
          title="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Couple</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No wedding plans found</p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-rose-600">{getPlanDisplayId(plan)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{plan.brideName} & {plan.groomName}</p>
                        {plan.theme && (
                          <p className="text-xs text-gray-500">{plan.theme} Theme</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plan.userId ? (
                        <div>
                          <p className="text-sm text-gray-900">{plan.userId.firstName} {plan.userId.lastName}</p>
                          <p className="text-xs text-gray-500">{plan.userId.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{plan.eventType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Calendar className="w-4 h-4" />
                        {formatDate(plan.eventDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-4 h-4" />
                        {plan.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{formatCurrency(plan.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {plan.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(plan)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {plan.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleConfirm(plan)}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                            title="Confirm Plan"
                          >
                            <Check className="w-4 h-4" />
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
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Wedding Plan Details"
        size="lg"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedPlan.brideName} & {selectedPlan.groomName}
                </h3>
                <p className="text-sm text-gray-500">Plan ID: {getPlanDisplayId(selectedPlan)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPlan.status)}`}>
                {selectedPlan.status?.replace('_', ' ')}
              </span>
            </div>

            {/* Customer Info */}
            {selectedPlan.userId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedPlan.userId.firstName} {selectedPlan.userId.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedPlan.userId.email}</p>
                  </div>
                  {selectedPlan.userId.phone && (
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedPlan.userId.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Event Type</span>
                <p className="font-medium">{selectedPlan.eventType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Event Date</span>
                <p className="font-medium">{formatDate(selectedPlan.eventDate)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Guest Count</span>
                <p className="font-medium">{selectedPlan.guestCount} guests</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">City</span>
                <p className="font-medium">{selectedPlan.city}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Budget</span>
                <p className="font-medium">{formatCurrency(selectedPlan.budget)}</p>
              </div>
              {selectedPlan.theme && (
                <div>
                  <span className="text-sm text-gray-500">Theme</span>
                  <p className="font-medium">{selectedPlan.theme}</p>
                </div>
              )}
              {selectedPlan.colorScheme && (
                <div>
                  <span className="text-sm text-gray-500">Color Scheme</span>
                  <p className="font-medium">{selectedPlan.colorScheme}</p>
                </div>
              )}
            </div>

            {/* Venue */}
            {selectedPlan.venueId && (
              <div className="bg-rose-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Selected Venue
                </h4>
                <p className="font-medium">{selectedPlan.venueId.name}</p>
                {selectedPlan.venueId.location?.city && (
                  <p className="text-sm text-gray-600">{selectedPlan.venueId.location.city}</p>
                )}
              </div>
            )}

            {/* Services */}
            {selectedPlan.services && selectedPlan.services.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Selected Services</h4>
                <div className="space-y-2">
                  {selectedPlan.services.map((service, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.category}</p>
                      </div>
                      <span className="font-medium">{formatCurrency(service.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {selectedPlan.addons && selectedPlan.addons.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Add-ons</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.addons.map((addon, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {addon.name} - {formatCurrency(addon.price)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {selectedPlan.timelineItems && selectedPlan.timelineItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4" /> Wedding Day Timeline
                </h4>
                <div className="space-y-2">
                  {selectedPlan.timelineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="font-medium text-rose-600 w-20">{item.time}</span>
                      <div>
                        <p className="font-medium">{item.event}</p>
                        {item.description && (
                          <p className="text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-rose-600">{formatCurrency(selectedPlan.totalAmount)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              {selectedPlan.status === 'SUBMITTED' && (
                <button
                  onClick={() => {
                    handleConfirm(selectedPlan);
                    setShowViewModal(false);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm Plan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WeddingPlansPage;
