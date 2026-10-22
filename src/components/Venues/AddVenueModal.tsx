import React, { useState, useEffect } from 'react';
import { Loader, X } from 'lucide-react';
import Modal from '../Common/Modal';
import { adminApi } from '../../services/api';

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendors: Array<{ _id: string; businessName: string }>;
}

const AddVenueModal: React.FC<AddVenueModalProps> = ({ isOpen, onClose, onSuccess, vendors }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    venueType: 'banquet-hall',
    vendorId: '',
    capacity: 500,
    minCapacity: 50,
    pricePerDay: 100000,
    pricePerPlate: 1000,
    address: '',
    city: '',
    state: '',
    pincode: '',
    amenities: [] as string[],
    imageUrls: [''],
  });

  const venueTypes = [
    { value: 'banquet-hall', label: 'Banquet Hall' },
    { value: 'resort', label: 'Resort' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'farmhouse', label: 'Farmhouse' },
    { value: 'garden', label: 'Garden' },
    { value: 'convention-center', label: 'Convention Center' },
  ];

  const amenityOptions = [
    'Air Conditioning', 'Parking', 'Valet Parking', 'WiFi', 'Catering',
    'Bar', 'DJ', 'Decoration', 'Bridal Room', 'Accommodation',
    'Swimming Pool', 'Garden', 'Stage', 'Sound System', 'Lighting'
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Venue name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Venue name must be at least 3 characters';
    }

    if (!formData.vendorId) {
      newErrors.vendorId = 'Please select a vendor';
    }

    if (!formData.venueType) {
      newErrors.venueType = 'Venue type is required';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (formData.shortDescription.trim().length > 200) {
      newErrors.shortDescription = 'Short description must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Full description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Full description must be at least 20 characters';
    }

    const minCap = Number(formData.minCapacity);
    if (!formData.minCapacity && formData.minCapacity !== 0) {
      newErrors.minCapacity = 'Min capacity is required';
    } else if (minCap <= 0) {
      newErrors.minCapacity = 'Min capacity must be greater than 0';
    }

    const maxCap = Number(formData.capacity);
    if (!formData.capacity && formData.capacity !== 0) {
      newErrors.capacity = 'Max capacity is required';
    } else if (maxCap <= minCap) {
      newErrors.capacity = 'Max capacity must be greater than min capacity';
    }

    const ppp = Number(formData.pricePerPlate);
    if (!formData.pricePerPlate && formData.pricePerPlate !== 0) {
      newErrors.pricePerPlate = 'Price per plate is required';
    } else if (ppp <= 0) {
      newErrors.pricePerPlate = 'Price per plate must be greater than 0';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.imageUrls];
    newUrls[index] = value;
    setFormData(prev => ({ ...prev, imageUrls: newUrls }));
  };

  const addImageUrl = () => {
    setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const venueData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        venueType: formData.venueType,
        vendorId: formData.vendorId,
        capacity: Number(formData.capacity),
        minCapacity: Number(formData.minCapacity),
        pricePerDay: Number(formData.pricePerDay),
        pricePerPlate: Number(formData.pricePerPlate),
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India',
        },
        amenities: formData.amenities.map(name => ({
          name,
          icon: name.toLowerCase().replace(/\s+/g, '-'),
          category: 'General',
          isIncluded: true,
          extraCost: 0,
        })),
        images: formData.imageUrls
          .filter(url => url.trim())
          .map((url, index) => ({
            url,
            altText: `${formData.name} - Image ${index + 1}`,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        status: 'ACTIVE',
      };

      await adminApi.createVenue(venueData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create venue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      venueType: 'banquet-hall',
      vendorId: '',
      capacity: 500,
      minCapacity: 50,
      pricePerDay: 100000,
      pricePerPlate: 1000,
      address: '',
      city: '',
      state: '',
      pincode: '',
      amenities: [],
      imageUrls: [''],
    });
    setError('');
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Venue" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Royal Grand Ballroom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type *</label>
            <select aria-label="Venue type"
              name="venueType"
              value={formData.venueType}
              onChange={handleChange}
              required
              title="Select venue type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {venueTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.venueType && <p className="text-red-500 text-xs mt-1">{errors.venueType}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <select aria-label="Vendor"
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
              required
              title="Select vendor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a vendor</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>{vendor.businessName}</option>
              ))}
            </select>
            {errors.vendorId && <p className="text-red-500 text-xs mt-1">{errors.vendorId}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              required
              placeholder="Brief description for cards (max 200 chars)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.shortDescription && <p className="text-red-500 text-xs mt-1">{errors.shortDescription}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Detailed venue description (min. 20 characters)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Capacity & Pricing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Capacity *</label>
            <input
              type="number"
              name="minCapacity"
              value={formData.minCapacity}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.minCapacity && <p className="text-red-500 text-xs mt-1">{errors.minCapacity}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity *</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price/Day (&#8377;)</label>
            <input
              type="number"
              name="pricePerDay"
              value={formData.pricePerDay}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price/Plate (&#8377;) *</label>
            <input
              type="number"
              name="pricePerPlate"
              value={formData.pricePerPlate}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.pricePerPlate && <p className="text-red-500 text-xs mt-1">{errors.pricePerPlate}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Full address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              placeholder="State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              placeholder="6-digit pincode"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => handleAmenityToggle(amenity)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  formData.amenities.includes(amenity)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs</label>
          <div className="space-y-2">
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {formData.imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImageUrl}
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              + Add another image
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Venue'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVenueModal;
