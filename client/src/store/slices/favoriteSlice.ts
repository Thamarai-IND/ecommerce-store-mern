import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProduct } from '../../types/index.js';

interface FavoriteState {
  items: IProduct[];
  favoriteIds: string[];
}

const initialState: FavoriteState = {
  items: [],
  favoriteIds: [],
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavorites: (state, action: PayloadAction<IProduct[]>) => {
      state.items = action.payload;
      state.favoriteIds = action.payload.map((p) => p._id || '');
    },
    addFavorite: (state, action: PayloadAction<IProduct>) => {
      const product = action.payload;
      if (!state.favoriteIds.includes(product._id || '')) {
        state.items.push(product);
        state.favoriteIds.push(product._id || '');
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.items = state.items.filter((p) => p._id !== productId);
      state.favoriteIds = state.favoriteIds.filter((id) => id !== productId);
    },
    clearFavorites: (state) => {
      state.items = [];
      state.favoriteIds = [];
    },
  },
});

export const { setFavorites, addFavorite, removeFavorite, clearFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer;
