// src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthData {
  user: User;
  accessToken: string;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Для httpOnly cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка сервера');
    }

    return data;
  }

  // ─── AUTH ─────────────────────────────────────────────────
  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthData> {
    const response = await this.request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
    }
    
    return response.data!;
  }

  async login(dto: { email: string; password: string }): Promise<AuthData> {
    const response = await this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
    }
    
    return response.data!;
  }

  async refresh(): Promise<string> {
    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    }
    
    throw new Error('Не удалось обновить токен');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setAccessToken(null);
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/profile', {
      method: 'POST',
    });
    return response.data!.user;
  }
}

export const apiClient = new ApiClient();
export type { User, AuthData, ApiResponse };
