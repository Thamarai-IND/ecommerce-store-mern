export interface IUser {
  _id?: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  rating?: number;
  reviews?: number;
}

export interface ICartItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder {
  _id?: string;
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentMethod: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDashboardStats {
  totalProductsBought: number;
  totalAmountSpent: number;
  ordersCount: number;
  recentOrders: IOrder[];
}

export interface ICategoryWiseStats {
  category: string;
  totalSales: number;
  quantity: number;
  revenue: number;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}
