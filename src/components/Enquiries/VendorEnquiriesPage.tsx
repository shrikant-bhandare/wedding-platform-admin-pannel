import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Clock, CheckCircle, XCircle, FileCheck, Loader, ChevronLeft, ChevronRight, X, MapPin, Phone, Mail, Users, Building2, Image } from 'lucide-react';
import { adminApi } from '../../services/api';

import { getUploadUrl } from '../../utils/imageUrl';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

const VendorEnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewEnquiry, setViewEnquiry] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, approved: 0, rejected: 0 });
  const [statusUpdate, setStatusUpdate] = useState({ status: '', adminNotes: '' });
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const res = await adminApi.getVendorEnquiries(params);
      const data = res?.data || res;
      setEnquiries(data?.data || []);
      setPagination({
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
        total: data?.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminApi.getVendorEnquiryStats();
      const data = res?.data?.stats || res?.stats || {};
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try {
      await adminApi.deleteVendorEnquiry(id);
      fetchEnquiries(pagination.page);
      fetchStats();
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
    }
  };

  const [updateError, setUpdateError] = useState('');

  const [vendorCredentials, setVendorCredentials] = useState<{ email: string; tempPassword: string; isExistingUser: boolean } | null>(null);

  const handleStatusUpdate = async () => {
    if (!viewEnquiry || !statusUpdate.status) return;

    // Confirm before approving — it creates real accounts
    if (statusUpdate.status === 'APPROVED' && viewEnquiry.status !== 'APPROVED') {
      const confirmed = window.confirm(
        'Approving this enquiry will automatically create:\n\n' +
        '• A Vendor user account\n' +
        '• A Vendor profile\n' +
        '• A Venue listing\n\n' +
        'Continue?'
      );
      if (!confirmed) return;
    }

    setUpdating(true);
    setUpdateError('');
    setVendorCredentials(null);
    try {
      const res = await adminApi.updateEnquiryStatus(viewEnquiry._id, statusUpdate);
      const creds = res?.data?.vendorCredentials || res?.vendorCredentials;
      if (creds) {
        setVendorCredentials(creds);
        // Re-fetch the enquiry so conversion info shows
        try {
          const updatedRes = await adminApi.getVendorEnquiryById(viewEnquiry._id);
          const updated = updatedRes?.data?.enquiry || updatedRes?.enquiry || updatedRes?.data;
          if (updated) setViewEnquiry(updated);
        } catch {}
      } else {
        setViewEnquiry(null);
      }
      fetchEnquiries(pagination.page);
      fetchStats();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setUpdateError(err?.response?.data?.message || err?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'REVIEWED': return 'bg-blue-100 text-blue-700';
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REVIEWED': return <FileCheck className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Enquiries</h1>
        <p className="text-gray-500 mt-1">Manage venue partnership requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Reviewed', value: stats.reviewed, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by venue name, location, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No enquiries found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Venue</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Photos</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.map((eq) => (
                <tr key={eq._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{eq.venueName}</td>
                  <td className="px-6 py-4 text-gray-600">{eq.phoneNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{eq.location}</td>
                  <td className="px-6 py-4 text-gray-600">{eq.guestCapacity}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Image className="w-4 h-4" /> {eq.photos?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(eq.status)}`}>
                      {getStatusIcon(eq.status)} {eq.status}
                    </span>
                    {eq.convertedVendorId && (
                      <span className="block mt-1 text-xs text-green-600 font-medium">✓ Converted</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(eq.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setViewEnquiry(eq); setStatusUpdate({ status: eq.status, adminNotes: eq.adminNotes || '' }); setVendorCredentials(null); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(eq._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchEnquiries(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchEnquiries(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {viewEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enquiry Details</h2>
              <button onClick={() => setViewEnquiry(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Venue Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Venue Name</p>
                    <p className="font-semibold">{viewEnquiry.venueName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">{viewEnquiry.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{viewEnquiry.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-semibold">{viewEnquiry.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Guest Capacity</p>
                    <p className="font-semibold">{viewEnquiry.guestCapacity}</p>
                  </div>
                </div>
              </div>

              {viewEnquiry.businessDescription && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Business Description</p>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{viewEnquiry.businessDescription}</p>
                </div>
              )}

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Bank Details</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                  <div><span className="text-gray-500">Account Holder:</span> <strong>{viewEnquiry.accountHolderName}</strong></div>
                  <div><span className="text-gray-500">Account No:</span> <strong>{viewEnquiry.bankAccountNumber}</strong></div>
                  <div><span className="text-gray-500">Bank:</span> <strong>{viewEnquiry.bankName || '—'}</strong></div>
                  <div><span className="text-gray-500">IFSC:</span> <strong>{viewEnquiry.ifscCode}</strong></div>
                  {viewEnquiry.gstNumber && <div><span className="text-gray-500">GST:</span> <strong>{viewEnquiry.gstNumber}</strong></div>}
                </div>
              </div>

              {/* Amenities */}
              {viewEnquiry.amenities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewEnquiry.amenities.map((a: string) => (
                      <span key={a} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {viewEnquiry.photos?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Venue Photos ({viewEnquiry.photos.length})</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {viewEnquiry.photos.map((photo: string, idx: number) => (
                      <a key={idx} href={getUploadUrl(photo)} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-400 transition-colors">
                        <img src={getUploadUrl(photo)} alt={`Venue ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-6">
                {/* Show conversion info if already approved */}
                {viewEnquiry.convertedVendorId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Converted Successfully
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">User ID:</span>
                        <p className="font-mono text-xs text-green-700 break-all">{viewEnquiry.convertedUserId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vendor ID:</span>
                        <p className="font-mono text-xs text-green-700 break-all">{viewEnquiry.convertedVendorId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Venue ID:</span>
                        <p className="font-mono text-xs text-green-700 break-all">{viewEnquiry.convertedVenueId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show vendor login credentials after approval */}
                {vendorCredentials && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      🔑 Vendor Login Credentials
                    </h4>
                    {vendorCredentials.isExistingUser ? (
                      <p className="text-sm text-blue-700">
                        This phone number was linked to an existing user. Their role has been upgraded to <strong>VENDOR</strong>. They can login with their existing password.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-blue-700 mb-2">Share these credentials with the vendor to login at <strong>localhost:5175</strong>:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-20">Email:</span>
                          <code className="bg-white px-3 py-1 rounded border text-sm font-mono flex-1">{vendorCredentials.email}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(vendorCredentials.email)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
                          >Copy</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-20">Password:</span>
                          <code className="bg-white px-3 py-1 rounded border text-sm font-mono flex-1">{vendorCredentials.tempPassword}</code>
                          <button
                            onClick={() => navigator.clipboard.writeText(vendorCredentials.tempPassword)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
                          >Copy</button>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">⚠️ Save these credentials now — the password won't be shown again.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Approval warning */}
                {statusUpdate.status === 'APPROVED' && !viewEnquiry.convertedVendorId && viewEnquiry.status !== 'APPROVED' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 text-sm font-medium">
                      ⚠️ Approving will automatically create a <strong>User account</strong>, <strong>Vendor profile</strong>, and <strong>Venue listing</strong> from this enquiry.
                    </p>
                  </div>
                )}

                {updateError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {updateError}
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex gap-3 mb-3">
                  {['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusUpdate(prev => ({ ...prev, status: s }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusUpdate.status === s ? getStatusColor(s).replace('100', '200') + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <textarea
                  value={statusUpdate.adminNotes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, adminNotes: e.target.value }))}
                  placeholder="Admin notes (optional)..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setViewEnquiry(null)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || statusUpdate.status === viewEnquiry.status}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorEnquiriesPage;
