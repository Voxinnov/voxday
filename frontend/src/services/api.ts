import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { LoginRequest, RegisterRequest } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/daybook-api/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearTokens();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private loadTokensFromStorage() {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      this.setTokens(accessToken);
    }
  }

  private setTokens(accessToken: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
  }

  private clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  async register(data: RegisterRequest): Promise<any> {
    const response = await this.client.post('/register', data);
    const result = response.data;
    
    if (result && result.token) {
      this.setTokens(result.token);
      return {
        data: {
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
            role: { name: typeof result.role === 'string' ? result.role : result.role?.name || typeof result.role }
          }
        }
      };
    }
    return response.data;
  }

  async login(credentials: LoginRequest): Promise<any> {
    const response = await this.client.post('/login', credentials);
    const data = response.data;
    
    if (data && data.token) {
      this.setTokens(data.token);
      return {
        data: {
          user: {
            id: data.id,
            name: data.name,
            email: data.email,
            role: { name: typeof data.role === 'string' ? data.role : data.role?.name || typeof data.role }
          }
        }
      };
    }
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data as T;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data as T;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data as T;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data as T;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
