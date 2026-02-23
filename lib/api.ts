// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/${API_VERSION}`;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && data.message?.includes('expired')) {
        // const refreshed = await this.refreshToken();
        // if (!refreshed && typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/login';
        
      }
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  private async request(endpoint: string, options: RequestInit = {}, includeAuth = true) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(includeAuth);
    try {
      const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ─── AUTH ────────────────────────────────────────────────────────────────

  async login(email: string, password: string, mfaCode?: string) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, mfaCode }) }, false);
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      const data = await this.request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false);
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.clear();
    }
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false);
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }, false);
  }

  // ─── USERS ───────────────────────────────────────────────────────────────

  async getUsers(filters?: { page?: number; limit?: number; status?: string; user_type?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.page)      params.append('page', filters.page.toString());
    if (filters?.limit)     params.append('limit', filters.limit.toString());
    if (filters?.status)    params.append('status', filters.status);
    if (filters?.user_type) params.append('user_type', filters.user_type);
    if (filters?.search)    params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/users${query}`);
  }

  async getUserById(userId: number) {
    return this.request(`/users/${userId}`);
  }

  /**
   * Create a new user account.
   * - user_type: 'admin'      → only super_admin can do this (also enforced on backend)
   * - user_type: 'b2b_client' → both super_admin and admin can do this
   * Viewer accounts go through createViewerAccount() instead.
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
    user_type: 'admin' | 'b2b_client';
  }) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(userData) });
  }

  async updateUser(userId: number, updates: { name?: string; company?: string; phone?: string }) {
    return this.request(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) });
  }

  async deleteUser(userId: number) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async lockUser(userId: number, reason: string) {
    return this.request(`/users/${userId}/lock`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async unlockUser(userId: number) {
    return this.request(`/users/${userId}/unlock`, { method: 'POST' });
  }

  async resetUserPassword(userId: number) {
    return this.request(`/users/${userId}/reset-password`, { method: 'POST' });
  }

  /**
   * Permanently block user
   */
  async permanentlyBlockUser(userId: number, reason: string, walletSettled?: boolean, settlementDetails?: {
    settlementMethod: string;
    transactionReference: string;
    settlementNotes: string;
    settlementDate: string;
  }) {
    return this.request(`/users/${userId}/permanent-block`, {
      method: 'POST',
      body: JSON.stringify({ reason, walletSettled, ...settlementDetails }),
    });
  }

  /**
   * Settle blocked user wallet
   */
  async settleUserWallet(
    userId: number,
    settlementData: {
      settlementMethod: string;
      transactionReference: string;
      settlementNotes: string;
      settlementDate: string;
    }
  ) {
    return this.request(`/users/${userId}/settle-wallet`, {
      method: 'POST',
      body: JSON.stringify(settlementData),
    });
  }


  // ─── VIEWER ACCOUNTS (under a b2b_client) ────────────────────────────────

  async getViewerAccounts(userId: number) {
    return this.request(`/users/${userId}/viewer-accounts`);
  }

  async createViewerAccount(userId: number, viewerData: { name: string; email: string; password: string }) {
    return this.request(`/users/${userId}/viewer-accounts`, { method: 'POST', body: JSON.stringify(viewerData) });
  }

  // ─── PRODUCTS ────────────────────────────────────────────────────────────

  async getUserProductAccess(userId: number) {
    return this.request(`/users/${userId}/products`);
  }

  async updateUserProductAccess(userId: number, productAccess: Array<{ productId: number; accessType: 'allow' | 'deny' }>) {
    return this.request(`/users/${userId}/products`, { method: 'PUT', body: JSON.stringify({ productAccess }) });
  }

  // ─── WALLET ──────────────────────────────────────────────────────────────

  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async getWalletTransactions(page = 1, limit = 20) {
    return this.request(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  async requestTopup(amount: number, receiptUrl: string) {
    return this.request('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount, receiptUrl }) });
  }

  async getTopupRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/wallet/topup-requests${query}`);
  }

  async approveTopup(requestId: number, mfaCode: string) {
    return this.request(`/wallet/topup/${requestId}/approve`, { method: 'POST', body: JSON.stringify({ mfaCode }) });
  }

  async rejectTopup(requestId: number, reason: string, mfaCode: string) {
    return this.request(`/wallet/topup/${requestId}/reject`, { method: 'POST', body: JSON.stringify({ reason, mfaCode }) });
  }
}

export const api = new ApiService();
export default ApiService;