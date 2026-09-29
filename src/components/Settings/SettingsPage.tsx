import React, { useState, useEffect } from 'react';
import { Save, Bell, Shield, Globe, CreditCard, Loader, CheckCircle, Banknote, Trash2, MessageCircle } from 'lucide-react';
import { adminApi } from '../../services/api';

interface EMIPartner {
  bankName: string;
  bankCode: string;
  logoUrl?: string;
  tenures: number[];
  interestRate: number;
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

interface PlatformSettings {
  _id?: string;
  platformName: string;
  supportEmail: string;
  platformFee: number;
  currency: string;
  emiMinAmount: number;
  emiTenureOptions: number[];
  emiEnabled: boolean;
  emiPartners: EMIPartner[];
  notifications: {
    newBookingAlerts: boolean;
    paymentNotifications: boolean;
    vendorApplications: boolean;
    userRegistrations: boolean;
    systemAlerts: boolean;
  };
  razorpayEnabled: boolean;
  codEnabled: boolean;
  minAdvancePayment: number;
  chatAiEnabled: boolean;
  chatAiGreeting: string;
  chatAiContext: string;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Wedven',
  supportEmail: 'support@wedven.com',
  platformFee: 5,
  currency: 'INR',
  emiMinAmount: 50000,
  emiTenureOptions: [3, 6, 9, 12],
  emiEnabled: true,
  emiPartners: [
    { bankName: 'HDFC Bank', bankCode: 'HDFC', tenures: [3, 6, 9, 12], interestRate: 14, processingFee: 1, minAmount: 10000, maxAmount: 500000, isActive: true },
    { bankName: 'ICICI Bank', bankCode: 'ICICI', tenures: [3, 6, 9, 12], interestRate: 15, processingFee: 1.5, minAmount: 10000, maxAmount: 300000, isActive: true },
    { bankName: 'Axis Bank', bankCode: 'AXIS', tenures: [3, 6, 12], interestRate: 14.5, processingFee: 1, minAmount: 15000, maxAmount: 400000, isActive: true },
    { bankName: 'SBI Card', bankCode: 'SBI', tenures: [3, 6, 9, 12, 18, 24], interestRate: 13, processingFee: 0.5, minAmount: 5000, maxAmount: 500000, isActive: true },
    { bankName: 'Kotak Mahindra', bankCode: 'KOTAK', tenures: [3, 6, 9], interestRate: 15, processingFee: 1, minAmount: 10000, maxAmount: 250000, isActive: true },
  ],
  notifications: {
    newBookingAlerts: true,
    paymentNotifications: true,
    vendorApplications: true,
    userRegistrations: true,
    systemAlerts: true,
  },
  razorpayEnabled: true,
  codEnabled: false,
  minAdvancePayment: 25,
  chatAiEnabled: false,
  chatAiGreeting: 'Hello! Welcome to Wedven. How can I help you with your wedding venue planning today?',
  chatAiContext: 'You are a helpful wedding venue booking assistant for Wedven platform. Help users with venue information, booking queries, pricing, and wedding planning tips. Be friendly and professional.',
};

const SettingsPage: React.FC<{ onEmiToggle?: (enabled: boolean) => void }> = ({ onEmiToggle }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payment Settings', icon: CreditCard },
    { id: 'emi', label: 'EMI & Partners', icon: Banknote },
    { id: 'chat', label: 'Chat & AI', icon: MessageCircle },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSettings();
      const settingsData = response.data?.settings || response.settings || response.data || {};
      setSettings({ ...defaultSettings, ...settingsData });
    } catch (err: any) {
      console.error('Error loading settings:', err);
      // Use default settings if API fails
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await adminApi.updateSettings(settings);
      setSuccess('Settings saved successfully!');
      if (onEmiToggle) onEmiToggle(settings.emiEnabled);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<PlatformSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateNotification = (key: keyof PlatformSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your platform settings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadSettings}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) => updateSettings({ platformName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (%)</label>
                    <input
                      type="number"
                      value={settings.platformFee}
                      onChange={(e) => updateSettings({ platformFee: Number(e.target.value) })}
                      min="0"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => updateSettings({ currency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">EMI Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Booking Amount for EMI (₹)</label>
                    <input
                      type="number"
                      value={settings.emiMinAmount}
                      onChange={(e) => updateSettings({ emiMinAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">EMI Tenure Options (months)</label>
                    <input
                      type="text"
                      value={settings.emiTenureOptions.join(', ')}
                      onChange={(e) => updateSettings({ 
                        emiTenureOptions: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                      })}
                      placeholder="3, 6, 9, 12"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'newBookingAlerts' as const, label: 'New Booking Alerts', description: 'Receive notifications for new bookings' },
                  { key: 'paymentNotifications' as const, label: 'Payment Notifications', description: 'Get alerts for payment updates' },
                  { key: 'vendorApplications' as const, label: 'Vendor Applications', description: 'Notify when new vendors apply' },
                  { key: 'userRegistrations' as const, label: 'User Registrations', description: 'Get alerts for new user signups' },
                  { key: 'systemAlerts' as const, label: 'System Alerts', description: 'Important system notifications' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications[item.key]}
                        onChange={(e) => updateNotification(item.key, e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Razorpay Payments</p>
                    <p className="text-sm text-gray-500">Enable online payments via Razorpay</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.razorpayEnabled}
                      onChange={(e) => updateSettings({ razorpayEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Allow payment at venue</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.codEnabled}
                      onChange={(e) => updateSettings({ codEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Advance Payment (%)</label>
                  <input
                    type="number"
                    value={settings.minAdvancePayment}
                    onChange={(e) => updateSettings({ minAdvancePayment: Number(e.target.value) })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Percentage of total amount required as advance</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emi' && (
            <div className="space-y-6">
              {/* EMI Overview */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">EMI Settings & Bank Partners</h3>
                  <p className="text-sm text-gray-500">Manage EMI payment options and partner banks</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.emiEnabled}
                      onChange={(e) => updateSettings({ emiEnabled: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{settings.emiEnabled ? 'EMI Enabled' : 'EMI Disabled'}</span>
                  </label>
                </div>
              </div>

              {/* EMI Configuration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">EMI Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Minimum Amount for EMI (₹)</label>
                    <input
                      type="number"
                      value={settings.emiMinAmount}
                      onChange={(e) => updateSettings({ emiMinAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Default Tenure Options (months)</label>
                    <input
                      type="text"
                      value={settings.emiTenureOptions.join(', ')}
                      onChange={(e) => updateSettings({ 
                        emiTenureOptions: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                      })}
                      placeholder="3, 6, 9, 12"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* EMI Partners Table */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">EMI Bank Partners</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenures</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing Fee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min/Max Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {settings.emiPartners.map((partner, index) => (
                        <tr key={partner.bankCode} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {partner.bankCode.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{partner.bankName}</p>
                                <p className="text-xs text-gray-500">{partner.bankCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {partner.tenures.map(t => `${t}M`).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {partner.interestRate}% p.a.
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {partner.processingFee}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            ₹{partner.minAmount.toLocaleString()} - ₹{partner.maxAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={partner.isActive}
                                onChange={(e) => {
                                  const updatedPartners = [...settings.emiPartners];
                                  updatedPartners[index] = { ...partner, isActive: e.target.checked };
                                  updateSettings({ emiPartners: updatedPartners });
                                }}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => {
                                const updatedPartners = settings.emiPartners.filter((_, i) => i !== index);
                                updateSettings({ emiPartners: updatedPartners });
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Remove Partner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EMI Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-1">Active Partners</h5>
                  <p className="text-2xl font-bold text-green-700">{settings.emiPartners.filter(p => p.isActive).length}</p>
                  <p className="text-sm text-green-600">of {settings.emiPartners.length} total banks</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-1">Avg Interest Rate</h5>
                  <p className="text-2xl font-bold text-purple-700">
                    {settings.emiPartners.length > 0 
                      ? (settings.emiPartners.reduce((sum, p) => sum + p.interestRate, 0) / settings.emiPartners.length).toFixed(1)
                      : 0}% p.a.
                  </p>
                  <p className="text-sm text-purple-600">across all partners</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-medium text-orange-900 mb-1">Min EMI Amount</h5>
                  <p className="text-2xl font-bold text-orange-700">₹{settings.emiMinAmount.toLocaleString()}</p>
                  <p className="text-sm text-orange-600">for EMI eligibility</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chat & AI Settings</h3>
              
              {/* AI Auto-Reply Toggle */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">AI Auto-Reply</p>
                    <p className="text-sm text-gray-500">When enabled, AI will automatically respond to user support messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.chatAiEnabled}
                      onChange={(e) => updateSettings({ chatAiEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {settings.chatAiEnabled && (
                <>
                  {/* Greeting Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Greeting Message
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Sent automatically when a user starts a new conversation</p>
                    <textarea
                      value={settings.chatAiGreeting}
                      onChange={(e) => updateSettings({ chatAiGreeting: e.target.value })}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="Hello! Welcome to Wedven..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{settings.chatAiGreeting.length}/500</p>
                  </div>

                  {/* AI Context */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Behavior Context
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Describe how the AI should behave and what it should know about your business</p>
                    <textarea
                      value={settings.chatAiContext}
                      onChange={(e) => updateSettings({ chatAiContext: e.target.value })}
                      rows={4}
                      maxLength={2000}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="You are a helpful wedding venue assistant..."
                    />
                    <p className="text-xs text-gray-400 mt-1">{settings.chatAiContext.length}/2000</p>
                  </div>

                  {/* Info box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-1">How AI Auto-Reply Works</p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>When a user sends a support message, the AI analyzes keywords and context</li>
                      <li>It responds with relevant information about venues, bookings, pricing, etc.</li>
                      <li>You can still manually reply from the Chat Support page at any time</li>
                      <li>AI replies appear as admin messages to the user</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                      Enable
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-500">Update your admin password</p>
                    </div>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
                      Update
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Active Sessions</p>
                      <p className="text-sm text-gray-500">Manage your active login sessions</p>
                    </div>
                    <button className="text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
                      Revoke All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
