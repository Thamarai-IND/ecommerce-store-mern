import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import productReducer from './slices/productSlice.js';
import cartReducer from './slices/cartSlice.js';
import orderReducer from './slices/orderSlice.js';
import favoriteReducer from './slices/favoriteSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    favorites: favoriteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
