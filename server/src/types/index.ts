import { Request } from "express";

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  name: string;
  role: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id?: string;
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered";
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAuthPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: IAuthPayload;
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
