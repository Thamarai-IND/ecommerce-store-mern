import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICartItem } from '../../types/index.js';

interface CartState {
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
}

const loadCartFromLocalStorage = (): ICartItem[] => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const saveCartToLocalStorage = (items: ICartItem[]): void => {
  localStorage.setItem('cart', JSON.stringify(items));
};

const calculateTotal = (items: ICartItem[]): { totalItems: number; totalPrice: number } => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, totalPrice };
};

const initialState: CartState = {
  items: loadCartFromLocalStorage(),
  totalItems: 0,
  totalPrice: 0,
};

// Calculate initial totals
const { totalItems, totalPrice } = calculateTotal(initialState.items);
initialState.totalItems = totalItems;
initialState.totalPrice = totalPrice;

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<ICartItem, '_id'> & { _id?: string }>) => {
      const existingItem = state.items.find((item) => item.productId === action.payload.productId);

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push({
          _id: action.payload._id || Date.now().toString(),
          ...action.payload,
        });
      }

      const { totalItems, totalPrice } = calculateTotal(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      saveCartToLocalStorage(state.items);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);

      const { totalItems, totalPrice } = calculateTotal(state.items);
      state.totalItems = totalItems;
      state.totalPrice = totalPrice;
      saveCartToLocalStorage(state.items);
    },

    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((item) => item.productId === action.payload.productId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((item) => item.productId !== action.payload.productId);
        } else {
          item.quantity = action.payload.quantity;
        }

        const { totalItems, totalPrice } = calculateTotal(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
        saveCartToLocalStorage(state.items);
      }
    },

    incrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.productId === action.payload);
      if (item) {
        item.quantity += 1;

        const { totalItems, totalPrice } = calculateTotal(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
        saveCartToLocalStorage(state.items);
      }
    },

    decrementQuantity: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.productId === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;

        const { totalItems, totalPrice } = calculateTotal(state.items);
        state.totalItems = totalItems;
        state.totalPrice = totalPrice;
        saveCartToLocalStorage(state.items);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      saveCartToLocalStorage([]);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
