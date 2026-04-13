import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProduct } from '../../types/index.js';

interface ProductState {
  products: IProduct[];
  categories: string[];
  selectedProduct: IProduct | null;
  searchResults: IProduct[];
  filteredProducts: IProduct[];
  loading: boolean;
  error: string | null;
  pagination: {
    skip: number;
    limit: number;
    total: number;
  };
}

const initialState: ProductState = {
  products: [],
  categories: [],
  selectedProduct: null,
  searchResults: [],
  filteredProducts: [],
  loading: false,
  error: null,
  pagination: {
    skip: 0,
    limit: 10,
    total: 0,
  },
};

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setProducts: (state, action: PayloadAction<{ products: IProduct[]; total: number }>) => {
      state.products = action.payload.products;
      state.pagination.total = action.payload.total;
      state.loading = false;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<IProduct | null>) => {
      state.selectedProduct = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<{ products: IProduct[]; total: number }>) => {
      state.searchResults = action.payload.products;
      state.pagination.total = action.payload.total;
    },
    setFilteredProducts: (state, action: PayloadAction<{ products: IProduct[]; total: number }>) => {
      state.filteredProducts = action.payload.products;
      state.pagination.total = action.payload.total;
    },
    setPagination: (state, action: PayloadAction<{ skip: number; limit: number }>) => {
      state.pagination.skip = action.payload.skip;
      state.pagination.limit = action.payload.limit;
    },
    clearSearch: (state) => {
      state.searchResults = [];
    },
    clearFilter: (state) => {
      state.filteredProducts = [];
    },
  },
});

export const {
  setLoading,
  setError,
  setProducts,
  setCategories,
  setSelectedProduct,
  setSearchResults,
  setFilteredProducts,
  setPagination,
  clearSearch,
  clearFilter,
} = productSlice.actions;
export default productSlice.reducer;
