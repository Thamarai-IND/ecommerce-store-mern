import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IOrder, IDashboardStats } from '../../types/index.js';

interface OrderState {
  orders: IOrder[];
  selectedOrder: IOrder | null;
  loading: boolean;
  error: string | null;
  dashboardStats: IDashboardStats | null;
  pagination: {
    skip: number;
    limit: number;
    total: number;
  };
}

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  dashboardStats: null,
  pagination: {
    skip: 0,
    limit: 10,
    total: 0,
  },
};

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setOrders: (state, action: PayloadAction<{ orders: IOrder[]; total: number }>) => {
      state.orders = action.payload.orders;
      state.pagination.total = action.payload.total;
      state.loading = false;
    },
    setSelectedOrder: (state, action: PayloadAction<IOrder | null>) => {
      state.selectedOrder = action.payload;
    },
    setDashboardStats: (state, action: PayloadAction<IDashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find((o) => o._id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status as IOrder['status'];
      }
      if (state.selectedOrder?._id === action.payload.orderId) {
        state.selectedOrder.status = action.payload.status as IOrder['status'];
      }
    },
    setPagination: (state, action: PayloadAction<{ skip: number; limit: number }>) => {
      state.pagination.skip = action.payload.skip;
      state.pagination.limit = action.payload.limit;
    },
  },
});

export const {
  setLoading,
  setError,
  setOrders,
  setSelectedOrder,
  setDashboardStats,
  updateOrderStatus,
  setPagination,
} = orderSlice.actions;
export default orderSlice.reducer;
