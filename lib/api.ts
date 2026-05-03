// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

type ValidationError = {
  field?: string;
  message?: string;
};

type ApiError = Error & {
  validationErrors?: ValidationError[];
};

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

  private getUserEmail(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.email || null;
    } catch {
      return null;
    }
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && data.message?.includes('expired')) {
        localStorage.clear();
        window.location.href = '/login';
      }
      if (
        response.status === 403 &&
        data.message === 'You must change your password before accessing this resource.'
      ) {
        localStorage.setItem('mustChangePassword', 'true');
        window.location.href = '/change-password';
      }

      const error: ApiError = new Error(data.message || 'API request failed');
      if (data.errors) {
        error.validationErrors = data.errors as ValidationError[];
        console.error('Validation Errors:', data.errors);
      }
      throw error;
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

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  /** Request an OTP for a specific action (e.g., 'wallet_approval') */
  async requestOTP(action: string) {
    const email = this.getUserEmail();
    if (!email) throw new Error("User email not found. Please log in again.");
    return this.request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ action, email }) });
  }

  /** Verify an OTP for a specific action */
  async verifyOTP(action: string, otp: string) {
    const email = this.getUserEmail();
    if (!email) throw new Error("User email not found. Please log in again.");
    return this.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ action, otp, email }) });
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
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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

  async getViewerAccounts(userId: number) {
    return this.request(`/users/${userId}/viewer-accounts`);
  }

  async createViewerAccount(userId: number, viewerData: { name: string; email: string; password: string }) {
    return this.request(`/users/${userId}/viewer-accounts`, { method: 'POST', body: JSON.stringify(viewerData) });
  }
  

  // ─── PRODUCTS CONFIG ─────────────────────────────────────────────────────

  async getUserProductConfig(id: number) {
    return this.request(`/users/${id}/products`);
  }
 
  async saveUserProductConfig(id: number, configs: {
    id: string; visible: boolean; customPrice?: number; useCustomPrice: boolean;
  }[]) {
    return this.request(`/users/${id}/products`, {
      method: 'PUT',
      body: JSON.stringify({ configs }),
    });
  }

  async getUserProductAccess(userId: number) {
    return this.request(`/users/${userId}/products`);
  }

  async updateUserProductAccess(userId: number, productAccess: Array<{ productId: number; accessType: 'allow' | 'deny' }>) {
    return this.request(`/users/${userId}/products`, { method: 'PUT', body: JSON.stringify({ productAccess }) });
  }

  // ─── WALLET – ADMIN ───────────────────────────────────────────────────────

  async getAllWalletBalances(filters?: { page?: number; limit?: number; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.page)   params.append('page',   String(filters.page));
    if (filters?.limit)  params.append('limit',  String(filters.limit));
    if (filters?.search) params.append('search', filters.search);
    return this.request(`/wallet/balances${params.toString() ? `?${params}` : ''}`);
  }

  async getTopupRequests(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return this.request(`/wallet/topup-requests?${params}`);
  }

  async approveTopup(requestId: number, mfaCode: string) {
    return this.request(`/wallet/topup/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ mfaCode }),
    });
  }

  async rejectTopup(requestId: number, reason: string, mfaCode: string) {
    return this.request(`/wallet/topup/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, mfaCode }),
    });
  }

  async getAllTransactions(filters?: { page?: number; limit?: number; userId?: number; type?: string }) {
    const params = new URLSearchParams();
    if (filters?.page)   params.append('page',   String(filters.page));
    if (filters?.limit)  params.append('limit',  String(filters.limit));
    if (filters?.userId) params.append('userId', String(filters.userId));
    if (filters?.type)   params.append('type',   filters.type);
    return this.request(`/wallet/transactions/all${params.toString() ? `?${params}` : ''}`);
  }
// ============================================
  // PRODUCTS
  // ============================================

  /** List products — optional filter by source='internal'|'carrypin' */
  async getProducts(f?: {
    page?: number; limit?: number; search?: string;
    category?: string; brand?: string; status?: string;
    source?: 'internal' | 'carrypin';
  }) {
    const p = new URLSearchParams();
    if (f?.page)     p.append('page',     String(f.page));
    if (f?.limit)    p.append('limit',    String(f.limit));
    if (f?.search)   p.append('search',   f.search);
    if (f?.category) p.append('category', f.category);
    if (f?.brand)    p.append('brand',    f.brand);
    if (f?.status)   p.append('status',   f.status);
    if (f?.source)   p.append('source',   f.source);
    return this.request(`/products${p.toString() ? '?' + p : ''}`);
  }
 
  async getProductMeta(): Promise<{ success: boolean; data: { categories: string[]; brands: string[] } }> {
    return this.request('/products/meta');
  }
 
  async getProductById(id: string | number) {
    return this.request(`/products/${id}`);
  }
 
  async createInternalProduct(d: {
    name: string; category: string; brand: string;
    description: string; redemptionInstructions: string;
    price: number; discountPrice?: number; images?: string[];
  }) {
    return this.request('/products/internal', { method: 'POST', body: JSON.stringify(d) });
  }
 
  async createSupplierProduct(d: {
    name: string; category: string; brand: string;
    description: string; redemptionInstructions: string;
    price: number; costPrice?: number; faceValue?: number;
    supplierName: string;
    supplierRef: string;
    supplierSkuRef?: string;
    realtimePrice?: boolean;
    syncEnabled?: boolean;
    images?: string[];
  }) {
    return this.request('/products/supplier', { method: 'POST', body: JSON.stringify(d) });
  }
 
  async updateProduct(id: string | number, d: Record<string, unknown>) {
    return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  }
 
  async toggleProductStatus(id: string | number) {
    return this.request(`/products/${id}/toggle-status`, { method: 'PATCH' });
  }
 
  async deleteProduct(id: string | number) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }
 
  async getProductCodes(id: string | number, f?: { page?: number; limit?: number; status?: string }) {
    const p = new URLSearchParams();
    if (f?.page)   p.append('page',   String(f.page));
    if (f?.limit)  p.append('limit',  String(f.limit));
    if (f?.status) p.append('status', f.status!);
    return this.request(`/products/${id}/codes${p.toString() ? '?' + p : ''}`);
  }
 
  async uploadProductCodes(id: string | number, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseURL}/products/${id}/upload-codes`, { method: 'POST', headers, body: fd });
    return this.handleResponse(res);
  }
 
  async importExcelPreview(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${this.baseURL}/products/import-excel`, { method: 'POST', headers, body: fd });
    return this.handleResponse(res);
  }
 
  async importBulkProducts(rows: unknown[]) {
    return this.request('/products/import-bulk', { method: 'POST', body: JSON.stringify({ rows }) });
  }
 
  async checkProductStock(id: string | number) {
    return this.request(`/products/${id}/stock-check`);
  }

  async uploadProductCodesJson(id: string | number, entries: { code: string; status: string }[], fileName: string) {
    return this.request(`/products/${id}/upload-codes-json`, {
      method: 'POST',
      body: JSON.stringify({ entries, fileName }),
    });
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  async getAllOrders(params?: { status?: string; userId?: number; page?: number; limit?: number; search?: string }) {
    const p = new URLSearchParams();
    if (params?.status) p.set('status', params.status);
    if (params?.userId) p.set('userId', String(params.userId));
    if (params?.page)   p.set('page',   String(params.page));
    if (params?.limit)  p.set('limit',  String(params.limit));
    if (params?.search) p.set('search', params.search); // Added search parameter
    return this.request(`/orders/admin/all${p.toString() ? '?' + p : ''}`);
  }
 
  async getAdminOrderById(id: string | number) {
    return this.request(`/orders/admin/${id}`);
  }
 
  async completeOrder(id: string | number) {
    return this.request(`/orders/admin/${id}/complete`, { method: 'POST' });
  }
}

export const api = new ApiService();
export default ApiService;
