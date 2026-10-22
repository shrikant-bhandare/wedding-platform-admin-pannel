/**
 * Admin Panel API Client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class AdminApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        // A failed login is a normal 401: let the login form show the error
        if (originalRequest?.url?.includes('/auth/login')) {
          return Promise.reject(error);
        }
        const refreshToken = localStorage.getItem('adminRefreshToken');
        // Access tokens expire after 15 minutes: refresh once and retry before logging out
        if (error.response?.status === 401 && refreshToken && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            this.refreshPromise = this.refreshPromise || this.refreshAccessToken(refreshToken);
            const newToken = await this.refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch {
            // fall through to logout
          } finally {
            this.refreshPromise = null;
          }
        }
        if (error.response?.status === 401) {
          this.clearSession();
          window.location.href = '/login';
        }
        // Surface the backend's reason (e.g. "Payment not received") instead of axios's generic message
        const apiMessage = (error.response?.data as any)?.message;
        if (apiMessage) {
          error.message = apiMessage;
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const data = response.data.data;
    localStorage.setItem('adminToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('adminRefreshToken', data.refreshToken);
    }
    return data.accessToken;
  }

  private clearSession() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
  }

  // Auth
  async login(email: string, password: string) {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      const data = response.data.data;
      
      if (!data?.user) {
        throw { message: 'Login failed' };
      }
      
      // Verify user is an admin or super admin
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        throw { message: 'Access denied. This portal is for administrators only.' };
      }
      
      if (data.accessToken) {
        localStorage.setItem('adminToken', data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        if (data.refreshToken) {
          localStorage.setItem('adminRefreshToken', data.refreshToken);
        }
      }
      return response.data;
    } catch (err: any) {
      // Re-throw with proper structure for error handling
      if (err.response?.data?.message) {
        throw { message: err.response.data.message };
      }
      throw { message: err.message || 'Login failed' };
    }
  }

  async logout() {
    // Revoke the refresh token server-side (best effort), then clear the local session
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken) {
      axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken }).catch(() => undefined);
    }
    this.clearSession();
  }

  getStoredUser() {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('adminToken');
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.client.get('/admin/dashboard');
    return response.data;
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    const response = await this.client.get('/admin/users', { params });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async createUser(data: { firstName: string; lastName: string; email: string; phone?: string; password: string; role: string }) {
    // /auth/register requires confirmPassword; the admin forms collect the password once
    const response = await this.client.post('/auth/register', { ...data, confirmPassword: data.password });
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.patch(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async deactivateUser(id: string) {
    const response = await this.client.patch(`/users/${id}/deactivate`);
    return response.data;
  }

  async reactivateUser(id: string) {
    const response = await this.client.patch(`/users/${id}/reactivate`);
    return response.data;
  }

  // Vendors
  async getVendors(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.client.get('/admin/vendors', { params });
    return response.data;
  }

  async getVendorById(id: string) {
    const response = await this.client.get(`/vendors/${id}`);
    return response.data;
  }

  async createVendorForUser(userId: string, data: any) {
    const response = await this.client.post(`/admin/vendors/create`, { userId, ...data });
    return response.data;
  }

  async approveVendor(id: string) {
    const response = await this.client.patch(`/vendors/${id}/status`, { status: 'APPROVED' });
    return response.data;
  }

  async rejectVendor(id: string, reason: string) {
    const response = await this.client.patch(`/vendors/${id}/status`, { status: 'REJECTED', rejectionReason: reason });
    return response.data;
  }

  async suspendVendor(id: string, reason: string) {
    const response = await this.client.patch(`/vendors/${id}/status`, { status: 'SUSPENDED', rejectionReason: reason });
    return response.data;
  }

  // Venues
  async getVenues(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    // Admin listing: every status (the public /venues only returns ACTIVE)
    const response = await this.client.get('/admin/venues', { params });
    return response.data;
  }

  async getVenueById(id: string) {
    const response = await this.client.get(`/venues/${id}`);
    return response.data;
  }

  async createVenue(data: any) {
    const response = await this.client.post('/admin/venues', data);
    return response.data;
  }

  async updateVenue(id: string, data: any) {
    const response = await this.client.patch(`/venues/${id}`, data);
    return response.data;
  }

  async deleteVenue(id: string) {
    const response = await this.client.delete(`/venues/${id}`);
    return response.data;
  }

  async approveVenue(id: string) {
    const response = await this.client.patch(`/venues/${id}/status`, { status: 'ACTIVE' });
    return response.data;
  }

  async rejectVenue(id: string, reason: string) {
    const response = await this.client.patch(`/venues/${id}/status`, { status: 'REJECTED', reason });
    return response.data;
  }

  // Bookings
  async getBookings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const response = await this.client.get('/admin/bookings', { params });
    return response.data;
  }

  async getBookingById(id: string) {
    const response = await this.client.get(`/bookings/${id}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string) {
    const response = await this.client.patch(`/bookings/${id}/status`, { status });
    return response.data;
  }

  async cancelBooking(id: string, reason: string) {
    const response = await this.client.patch(`/bookings/${id}/cancel`, { cancellationReason: reason });
    return response.data;
  }

  // Payments
  async getPayments(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.client.get('/admin/payments', { params });
    return response.data;
  }

  async getPayoutRequests() {
    const response = await this.client.get('/admin/payments/payouts/pending');
    return response.data;
  }

  async processPayout(payoutId: string, action: 'approve' | 'reject', transactionId?: string) {
    const response = await this.client.patch(`/payments/payouts/${payoutId}/process`, { action, transactionId });
    return response.data;
  }

  // Reviews
  async getReportedReviews() {
    const response = await this.client.get('/reviews/reported');
    return response.data;
  }

  async moderateReview(id: string, action: 'approve' | 'reject') {
    const response = await this.client.patch(`/reviews/${id}/moderate`, { action });
    return response.data;
  }

  // Wedding Plans
  async getWeddingPlans(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.client.get('/wedding-plans/admin/all', { params });
    return response.data;
  }

  async getWeddingPlanById(id: string) {
    const response = await this.client.get(`/wedding-plans/${id}`);
    return response.data;
  }

  async getWeddingPlanStats() {
    const response = await this.client.get('/wedding-plans/admin/stats');
    return response.data;
  }

  async confirmWeddingPlan(id: string) {
    const response = await this.client.post(`/wedding-plans/${id}/confirm`);
    return response.data;
  }

  async updateWeddingPlan(id: string, data: any) {
    const response = await this.client.patch(`/wedding-plans/${id}`, data);
    return response.data;
  }

  // Blog
  async getBlogs(params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) {
    // Admin listing: no status returns drafts too (the public /blog is published-only)
    const response = await this.client.get('/admin/blog', { params });
    return response.data;
  }

  async getBlogById(id: string) {
    const response = await this.client.get(`/blog/${id}`);
    return response.data;
  }

  async createBlog(data: { title: string; content: string; excerpt?: string; category: string; tags?: string[]; featuredImage?: string; status?: string }) {
    const response = await this.client.post('/blog', data);
    return response.data;
  }

  async updateBlog(id: string, data: any) {
    const response = await this.client.patch(`/blog/${id}`, data);
    return response.data;
  }

  async deleteBlog(id: string) {
    const response = await this.client.delete(`/blog/${id}`);
    return response.data;
  }

  async getBlogCategories() {
    const response = await this.client.get('/blog/categories');
    return response.data;
  }

  // Orders (Bookings management)
  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const response = await this.client.get('/admin/bookings', { params });
    return response.data;
  }

  async getOrderById(id: string) {
    const response = await this.client.get(`/bookings/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: string, status: string) {
    const response = await this.client.patch(`/bookings/${id}/status`, { status });
    return response.data;
  }

  // Orders are bookings: use the admin booking routes (the POST confirm/cancel routes are vendor/customer only)
  async cancelOrder(id: string, reason: string) {
    return this.cancelBooking(id, reason);
  }

  async confirmOrder(id: string) {
    return this.updateBookingStatus(id, 'CONFIRMED');
  }

  // Settings
  async getSettings() {
    const response = await this.client.get('/admin/settings');
    return response.data;
  }

  async updateSettings(settings: any) {
    const response = await this.client.patch('/admin/settings', settings);
    return response.data;
  }

  // Offers
  async getOffers(params?: { page?: number; limit?: number; status?: string; type?: string; search?: string }) {
    const response = await this.client.get('/offers', { params });
    return response.data;
  }

  async getOfferById(id: string) {
    const response = await this.client.get(`/offers/${id}`);
    return response.data;
  }

  async createOffer(data: any) {
    const response = await this.client.post('/offers', data);
    return response.data;
  }

  async updateOffer(id: string, data: any) {
    const response = await this.client.patch(`/offers/${id}`, data);
    return response.data;
  }

  async deleteOffer(id: string) {
    const response = await this.client.delete(`/offers/${id}`);
    return response.data;
  }

  // Vendor Enquiries
  async getVendorEnquiries(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const response = await this.client.get('/vendor-enquiries', { params });
    return response.data;
  }

  async getVendorEnquiryById(id: string) {
    const response = await this.client.get(`/vendor-enquiries/${id}`);
    return response.data;
  }

  async updateEnquiryStatus(id: string, data: { status: string; adminNotes?: string }) {
    const response = await this.client.patch(`/vendor-enquiries/${id}/status`, data);
    return response.data;
  }

  async deleteVendorEnquiry(id: string) {
    const response = await this.client.delete(`/vendor-enquiries/${id}`);
    return response.data;
  }

  async getVendorEnquiryStats() {
    const response = await this.client.get('/vendor-enquiries/stats');
    return response.data;
  }

  // Chat Support
  async getAllChats(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/chat/admin/all', { params });
    return response.data;
  }

  async getChatMessages(chatId: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/chat/${chatId}/messages`, { params });
    return response.data;
  }

  async adminReplyChat(chatId: string, content: string) {
    const response = await this.client.post(`/chat/admin/${chatId}/reply`, { content });
    return response.data;
  }

  async markChatRead(chatId: string) {
    const response = await this.client.patch(`/chat/${chatId}/read`);
    return response.data;
  }
}

export const adminApi = new AdminApiClient();
export default adminApi;
