import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { CacheService } from '../utils/cache.js';
import { setProducts, setCategories, setSearchResults, clearSearch } from '../store/slices/productSlice.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { Search, Filter, ShoppingCart, Star } from 'lucide-react';
import { IProduct } from '../types/index.js';

interface ProductListResponse {
  products: IProduct[];
  total: number;
}

export const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, categories, searchResults } = useAppSelector((state) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try cache first
        const cachedProducts = CacheService.get<ProductListResponse>('products:list');
        if (cachedProducts) {
          dispatch(setProducts(cachedProducts));
        }

        // Fetch fresh data
        const productsData = await apiService.getProducts(0, 12) as ProductListResponse;
        dispatch(setProducts(productsData));
        CacheService.set('products:list', productsData);

        // Fetch categories
        const categoriesData = await apiService.getCategories();
        dispatch(setCategories(categoriesData.categories));
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadData();
  }, [dispatch]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      dispatch(clearSearch());
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiService.searchProducts(searchQuery);
      dispatch(setSearchResults(results));
      CacheService.set(`search:${searchQuery}`, results);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filters = {
        category: selectedCategory || undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      };

      const results = await apiService.filterProducts(filters);
      dispatch(setSearchResults(results));
    } catch (error) {
      console.error('Error filtering products:', error);
    }
  };

  const handleAddToCart = (product: any) => {
    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      })
    );
    alert('Added to cart!');
  };

  const displayProducts = isSearching ? searchResults : products;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Products</h1>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Search */}
          <form onSubmit={handleSearch} className="col-span-1 md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-primary text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Filter by Price</h3>
          </div>
          <form onSubmit={handleFilter} className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="input w-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="999999"
                className="input w-24"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Apply Filter
            </button>
          </form>
        </div>

        {/* Products Grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product: any) => (
              <div key={product._id} className="card">
                <div className="mb-4 bg-gray-200 h-40 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary">${product.price}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <span className="font-semibold">{product.rating || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600">Category: {product.category}</span>
                  <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};
