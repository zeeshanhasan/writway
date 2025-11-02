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

// User and tenant type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export interface Tenant {
  id: string;
  name: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  businessType: string | null;
  practiceAreas: string | null;
  activeClients: number | null;
  goals: string | null;
  isOnboardingComplete: boolean;
  plan: unknown;
}

export interface CurrentUserData {
  user: User;
  tenant: Tenant;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request<T = Json>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include', // This ensures cookies are sent with the request
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      // Add timeout for long-running requests (like document generation)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout
      
      // Log the request for debugging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[API] Fetching:', url, 'Method:', config.method || 'GET');
      }
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = (data as any)?.error?.message || (data as any)?.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return data as T;
    } catch (error) {
      // Enhanced error logging for debugging
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // eslint-disable-next-line no-console
          console.error('[API] Request timed out:', url);
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          // eslint-disable-next-line no-console
          console.error('[API] Network error - Failed to fetch:', url);
          // eslint-disable-next-line no-console
          console.error('[API] Check if backend is running at:', this.baseURL);
          // eslint-disable-next-line no-console
          console.error('[API] Error details:', error);
          throw new Error(`Cannot connect to server at ${this.baseURL}. Please ensure the backend is running.`);
        }
        // eslint-disable-next-line no-console
        console.error('[API] Request failed:', url, error.message);
        throw error;
      }
      
      // eslint-disable-next-line no-console
      console.error('[API] Unknown error:', error);
      throw new Error('Network error. Please check your connection and try again.');
    }
  }

  getToken(): string | null {
    // Tokens are stored in httpOnly cookies, not localStorage
    // The backend will automatically read them from cookies
    return null;
  }

  setToken(token: string): void {
    // Tokens are managed by backend via httpOnly cookies
    // No need to store in localStorage
  }

  removeToken(): void {
    // Tokens are managed by backend via httpOnly cookies
    // No need to remove from localStorage
  }

  // Auth endpoints
  async getCurrentUser(): Promise<ApiEnvelope<CurrentUserData>> {
    return this.request<ApiEnvelope<CurrentUserData>>('/auth/me');
  }

  async logout(): Promise<ApiEnvelope<unknown>> {
    const result = await this.request<ApiEnvelope<unknown>>('/auth/logout', { method: 'POST' });
    // Backend handles token removal via cookie clearing
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

  // Claim endpoints
  async analyzeClaimDescription(description: string): Promise<ApiEnvelope<{
    extracted: Partial<unknown>;
    missing: string[];
    ambiguous: Array<{ field: string; reason: string; question: string }>;
  }>> {
    return this.request<ApiEnvelope<{
      extracted: Partial<unknown>;
      missing: string[];
      ambiguous: Array<{ field: string; reason: string; question: string }>;
    }>>('/claim/analyze', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  async getNextQuestion(
    claimData: Partial<unknown>,
    answeredQuestions: string[] = []
  ): Promise<ApiEnvelope<{
    question: {
      id: string;
      field: string;
      type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
      label: string;
      description?: string;
      required: boolean;
      options?: Array<{ label: string; value: string }>;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    } | null;
    completed: boolean;
  }>> {
    return this.request<ApiEnvelope<{
      question: {
        id: string;
        field: string;
        type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
        label: string;
        description?: string;
        required: boolean;
        options?: Array<{ label: string; value: string }>;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
        };
      } | null;
      completed: boolean;
    }>>('/claim/questions/next', {
      method: 'POST',
      body: JSON.stringify({ claimData, answeredQuestions }),
    });
  }

  async generateClaimDocuments(
    claimData: unknown,
    initialDescription?: string
  ): Promise<ApiEnvelope<{
    claimType: string;
    legalBases?: string;
    form7AText: string;
    scheduleAText: string;
    warnings?: string;
  }>> {
    return this.request<ApiEnvelope<{
      claimType: string;
      legalBases?: string;
      form7AText: string;
      scheduleAText: string;
      warnings?: string;
    }>>('/claim/generate', {
      method: 'POST',
      body: JSON.stringify({ claimData, initialDescription }),
    });
  }
}

export const apiClient = new ApiClient();
