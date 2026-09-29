import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { adminApi } from '../../services/api';

interface OfferFormData {
  title: string;
  description: string;
  type: string;
  originalPrice: string;
  discountedPrice: string;
  discountPercent: string;
  couponCode: string;
  validFrom: string;
  validTill: string;
  featured: boolean;
  gradient: string;
  icon: string;
  status: string;
}

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

const OFFER_TYPES = [
  { value: 'FEATURED_DEAL', label: 'Featured Deal' },
  { value: 'SEASONAL', label: 'Seasonal' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'EARLY_BIRD', label: 'Early Bird' },
  { value: 'WEEKEND', label: 'Weekend' },
  { value: 'CUSTOM', label: 'Custom' },
];

const GRADIENTS = [
  { value: 'from-emerald-500 to-teal-500', label: 'Emerald', preview: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { value: 'from-blue-500 to-indigo-500', label: 'Blue', preview: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  { value: 'from-purple-500 to-pink-500', label: 'Purple', preview: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'from-amber-500 to-orange-500', label: 'Amber', preview: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { value: 'from-red-500 to-rose-600', label: 'Red', preview: 'bg-gradient-to-r from-red-500 to-rose-600' },
  { value: 'from-pink-500 to-rose-500', label: 'Pink', preview: 'bg-gradient-to-r from-pink-500 to-rose-500' },
];

const ICONS = ['Gift', 'Zap', 'Users', 'Sparkles', 'Percent', 'Tag', 'Star', 'Heart'];

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ isOpen, onClose, onSuccess, editData }) => {
  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    type: 'CUSTOM',
    originalPrice: '',
    discountedPrice: '',
    discountPercent: '',
    couponCode: '',
    validFrom: '',
    validTill: '',
    featured: false,
    gradient: 'from-emerald-500 to-teal-500',
    icon: 'Gift',
    status: 'DRAFT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        description: editData.description || '',
        type: editData.type || 'CUSTOM',
        originalPrice: editData.originalPrice?.toString() || '',
        discountedPrice: editData.discountedPrice?.toString() || '',
        discountPercent: editData.discountPercent?.toString() || '',
        couponCode: editData.couponCode || '',
        validFrom: formatDateForInput(editData.validFrom),
        validTill: formatDateForInput(editData.validTill),
        featured: editData.featured || false,
        gradient: editData.gradient || 'from-emerald-500 to-teal-500',
        icon: editData.icon || 'Gift',
        status: editData.status || 'DRAFT',
      });
    } else {
      setFormData({
        title: '', description: '', type: 'CUSTOM', originalPrice: '', discountedPrice: '',
        discountPercent: '', couponCode: '', validFrom: '', validTill: '', featured: false,
        gradient: 'from-emerald-500 to-teal-500', icon: 'Gift', status: 'DRAFT',
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        validFrom: formData.validFrom,
        validTill: formData.validTill,
        featured: formData.featured,
        gradient: formData.gradient,
        icon: formData.icon,
        status: formData.status,
      };

      if (formData.originalPrice) payload.originalPrice = Number(formData.originalPrice);
      if (formData.discountedPrice) payload.discountedPrice = Number(formData.discountedPrice);
      if (formData.discountPercent) payload.discountPercent = Number(formData.discountPercent);
      if (formData.couponCode) payload.couponCode = formData.couponCode;

      if (editData?._id) {
        await adminApi.updateOffer(editData._id, payload);
      } else {
        await adminApi.createOffer(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {editData ? 'Edit Offer' : 'Create Offer'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {OFFER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price (₹)</label>
                <input
                  type="number"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="0" max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g. MONSOON25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till *</label>
                <input
                  type="date"
                  value={formData.validTill}
                  onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Color</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gradient: g.value })}
                      className={`w-8 h-8 rounded-lg ${g.preview} ${formData.gradient === g.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured Offer</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {editData ? 'Update Offer' : 'Create Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferModal;
