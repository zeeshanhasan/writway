// API client for WritWay backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.removeToken();
    return result;
  }

  // Tenant endpoints
  async getTenant(tenantId) {
    return this.request(`/tenant/${tenantId}`);
  }

  async completeOnboarding(tenantId, data) {
    return this.request(`/tenant/${tenantId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateTenantSettings(tenantId, data) {
    return this.request(`/tenant/${tenantId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Plan endpoints
  async getPlans() {
    return this.request('/plan/list');
  }

  async getPlan(planId) {
    return this.request(`/plan/${planId}`);
  }

  // Billing endpoints
  async getBillingInfo() {
    return this.request('/billing/info');
  }

  async upgradePlan(planId) {
    return this.request('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }
}

export const apiClient = new ApiClient();
