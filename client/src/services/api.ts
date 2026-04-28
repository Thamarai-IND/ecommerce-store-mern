import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { IProduct } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ProductListApiResponse {
  data?: IProduct[];
  products?: IProduct[];
  total?: number;
}

interface ProductListNormalized {
  products: IProduct[];
  total: number;
}

interface CreateOrderItemPayload {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  userReview?: string;
  userRating?: number;
}

interface ProductFeedbackSummary {
  averageRating: number;
  reviewCount: number;
}

interface ProductFeedbackReview {
  userId: string;
  userName: string;
  rating?: number;
  review?: string;
  createdAt?: string;
}

interface CategorySalesStat {
  category: string;
  totalRevenue: number;
  totalQuantity: number;
}

interface ProductRevenueStat {
  productId: string;
  productName: string;
  category: string;
  totalRevenue: number;
  totalQuantity: number;
}

interface CategorySalesResponse {
  categorySales: CategorySalesStat[];
  productRevenue: ProductRevenueStat[];
}

export class ApiService {
  private client: AxiosInstance;

  private normalizeProductListResponse(payload: ProductListApiResponse): ProductListNormalized {
    const products = payload.products ?? payload.data ?? [];
    return {
      products,
      total: payload.total ?? products.length,
    };
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/users/register', { email, password, name });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/users/login', { email, password });
    return response.data;
  }

  async getUserProfile(userId: string) {
    const response = await this.client.get(`/users/profile/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, data: any) {
    const response = await this.client.put(`/users/${userId}`, data);
    return response.data;
  }

  // Product endpoints
  async getProducts(skip = 0, limit = 10) {
    const response = await this.client.get('/products', { params: { skip, limit } });
    return this.normalizeProductListResponse(response.data);
  }

  async getProductById(productId: string) {
    const response = await this.client.get(`/products/${productId}`);
    return response.data;
  }

  async searchProducts(query: string, skip = 0, limit = 10) {
    const response = await this.client.get('/products/search', {
      params: { q: query, skip, limit },
    });
    return this.normalizeProductListResponse(response.data);
  }

  async getProductsByCategory(category: string, skip = 0, limit = 10) {
    const response = await this.client.get(`/products/category/${category}`, {
      params: { skip, limit },
    });
    return this.normalizeProductListResponse(response.data);
  }

  async filterProducts(filters: any, skip = 0, limit = 10) {
    const response = await this.client.get('/products/filter', {
      params: { ...filters, skip, limit },
    });
    return this.normalizeProductListResponse(response.data);
  }

  async getCategories() {
    const response = await this.client.get('/products/categories/list');
    return response.data;
  }

  // Admin product endpoints
  async createProduct(data: any) {
    const response = await this.client.post('/products', data);
    return response.data;
  }

  async updateProduct(productId: string, data: any) {
    const response = await this.client.put(`/products/${productId}`, data);
    return response.data;
  }

  async deleteProduct(productId: string) {
    const response = await this.client.delete(`/products/${productId}`);
    return response.data;
  }

  // Order endpoints
  async createOrder(items: CreateOrderItemPayload[], totalAmount: number, paymentMethod: string) {
    const response = await this.client.post('/orders', {
      items,
      totalAmount,
      paymentMethod,
    });
    return response.data;
  }

  async getUserOrders(userId: string, skip = 0, limit = 10) {
    const response = await this.client.get(`/orders/user/${userId}`, {
      params: { skip, limit },
    });
    return response.data;
  }

  async getOrderById(orderId: string) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const response = await this.client.put(`/orders/${orderId}`, { status });
    return response.data;
  }

  async getDashboardStats(userId: string) {
    const response = await this.client.get(`/orders/dashboard/${userId}`);
    return response.data;
  }

  async getCategoryWiseSalesStats(): Promise<CategorySalesResponse> {
    const response = await this.client.get('/orders/stats/category-sales');
    return response.data;
  }

  async getProductFeedbackSummary(productId: string): Promise<ProductFeedbackSummary> {
    const response = await this.client.get(`/orders/feedback/summary/${productId}`);
    return response.data;
  }

  async getProductFeedbackReviews(productId: string): Promise<ProductFeedbackReview[]> {
    const response = await this.client.get(`/orders/feedback/reviews/${productId}`);
    return response.data;
  }

  async syncProductFeedbackFromOrders() {
    const response = await this.client.post('/orders/feedback/sync-products');
    return response.data;
  }

  async getCategoryWiseRatingStats() {
    const response = await this.client.get('/products/stats/category-ratings');
    return response.data;
  }

  async getProductWiseRatingStats() {
    const response = await this.client.get('/products/stats/product-ratings');
    return response.data;
  }

  async getAllOrders(skip = 0, limit = 10) {
    const response = await this.client.get('/orders', { params: { skip, limit } });
    return response.data;
  }
}

export const apiService = new ApiService();
