// API client for WritWay backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Json = unknown;

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T;
  error: unknown | null;
  meta?: unknown;
};

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request<T = Json>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (data as any)?.message || 'Request failed';
        throw new Error(message);
      }

      return data as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('API request failed:', error);
      throw error;
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('auth_token', token);
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async getCurrentUser(): Promise<ApiEnvelope<{ user: unknown; tenant: unknown }>> {
    return this.request<ApiEnvelope<{ user: unknown; tenant: unknown }>>('/auth/me');
  }

  async logout(): Promise<ApiEnvelope<unknown>> {
    const result = await this.request<ApiEnvelope<unknown>>('/auth/logout', { method: 'POST' });
    this.removeToken();
    return result;
  }

  // Tenant endpoints
  async getTenant(tenantId: string): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>(`/tenant/${tenantId}`);
  }

  async completeOnboarding(tenantId: string, data: unknown): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>(`/tenant/${tenantId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateTenantSettings(tenantId: string, data: unknown): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>(`/tenant/${tenantId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Plan endpoints
  async getPlans(): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>('/plan/list');
  }

  async getPlan(planId: string): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>(`/plan/${planId}`);
  }

  // Billing endpoints
  async getBillingInfo(): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>('/billing/info');
  }

  async upgradePlan(planId: string): Promise<ApiEnvelope<unknown>> {
    return this.request<ApiEnvelope<unknown>>('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }
}

export const apiClient = new ApiClient();
