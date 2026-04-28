import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { CacheService } from '../utils/cache.js';
import { setProducts, setCategories, setSearchResults, clearSearch } from '../store/slices/productSlice.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { addFavorite, removeFavorite } from '../store/slices/favoriteSlice.js';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Heart, ShoppingCart, Star } from 'lucide-react';
import { IProduct } from '../types/index.js';

interface ProductListResponse {
  products: IProduct[];
  total: number;
}

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products, categories, searchResults } = useAppSelector((state) => state.products);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { favoriteIds } = useAppSelector((state) => state.favorites);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
  const categoryRowsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [categoryScrollState, setCategoryScrollState] = useState<Record<string, { canLeft: boolean; canRight: boolean }>>({});

  // Load products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure products ratings/reviews are refreshed from order feedback.
        await apiService.syncProductFeedbackFromOrders();

        // Try cache first
        const cachedProducts = CacheService.get<ProductListResponse>('products:list');
        if (cachedProducts) {
          dispatch(setProducts(cachedProducts));
        }

        // Fetch fresh data
        const productsData = await apiService.getProducts(0, 1000) as ProductListResponse;
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const updateCategoryRowScrollState = (category: string) => {
    const row = categoryRowsRef.current[category];
    if (!row) return;

    const canLeft = row.scrollLeft > 0;
    const canRight = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;

    setCategoryScrollState((prev) => {
      const current = prev[category];
      if (current && current.canLeft === canLeft && current.canRight === canRight) {
        return prev;
      }
      return {
        ...prev,
        [category]: { canLeft, canRight },
      };
    });
  };

  const handleCategoryRowArrowScroll = (category: string, direction: 'left' | 'right') => {
    const row = categoryRowsRef.current[category];
    if (!row) return;

    row.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      dispatch(clearSearch());
      setIsSearching(false);
      setSelectedCategory('');
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

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    setIsSearching(true);
    try {
      let results;
      if (category) {
        results = await apiService.getProductsByCategory(category);
      } else {
        const productsData = await apiService.getProducts(0, 1000);
        results = productsData;
      }
      dispatch(setSearchResults(results));
    } catch (error) {
      console.error('Error filtering by category:', error);
    }
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
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

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>, product: IProduct) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowAuthToast(true);

      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = window.setTimeout(() => {
        setShowAuthToast(false);
        navigate('/login');
      }, 1200);
      return;
    }

    dispatch(
      addToCart({
        productId: product._id || '',
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      })
    );
    alert('Added to cart!');
  };

  const handleToggleFavorite = (e: React.MouseEvent, product: IProduct) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please login to add favorites');
      navigate('/login');
      return;
    }

    if (favoriteIds.includes(product._id || '')) {
      dispatch(removeFavorite(product._id || ''));
    } else {
      dispatch(addFavorite(product));
    }
  };

  const displayProducts = isSearching ? searchResults : products;

  const groupedProducts = useMemo(() => {
    return products.reduce<Record<string, IProduct[]>>((acc, product) => {
      const category = product.category || 'Others';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  const showCategoryWiseRows =
    isAuthenticated &&
    user?.role === 'user' &&
    !isSearching &&
    !searchQuery.trim() &&
    !selectedCategory &&
    !minPrice &&
    !maxPrice;

  useEffect(() => {
    if (!showCategoryWiseRows) return;

    const rafId = window.requestAnimationFrame(() => {
      Object.keys(groupedProducts).forEach((category) => {
        updateCategoryRowScrollState(category);
      });
    });

    const onResize = () => {
      Object.keys(groupedProducts).forEach((category) => {
        updateCategoryRowScrollState(category);
      });
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [groupedProducts, showCategoryWiseRows]);

  const renderProductCard = (product: IProduct, horizontal = false) => (
    <div
      key={product._id}
      onClick={() => navigate(`/product/${product._id}`)}
      className={`card group transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl cursor-pointer ${horizontal ? 'w-[10.5rem] sm:w-[12rem] md:w-[14rem] lg:w-[18rem] shrink-0 snap-start' : ''}`}
    >
      <div className={`mb-4 rounded-t-xl flex items-center justify-center overflow-hidden relative ${horizontal ? 'h-32 sm:h-36 md:h-40 lg:h-48' : 'h-56'}`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
        <button
          onClick={(e) => handleToggleFavorite(e, product)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full hover:shadow-lg transition"
          aria-label="Add to favorites"
        >
          <Heart
            className={`w-5 h-5 ${
              favoriteIds.includes(product._id || '') ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      <div className={`${horizontal ? 'm-3 sm:m-4' : 'm-4'}`}>
        <h3 className={`${horizontal ? 'text-sm sm:text-base md:text-lg' : 'text-xl'} text-white font-semibold mb-2 line-clamp-1`}>{product.name}</h3>
        <p className={`${horizontal ? 'text-xs sm:text-sm' : 'text-md'} text-stone-500 mb-2 line-clamp-2`}>{product.description}</p>

        <div className={`flex items-center justify-between ${horizontal ? 'mb-3' : 'mb-4'}`}>
          <span className={`${horizontal ? 'text-base sm:text-lg' : 'text-2xl'} font-bold text-purple-600`}>₹{product.price}</span>
          <div className="flex items-center space-x-1">
            <Star className={`${horizontal ? 'w-4 h-4' : 'w-5 h-5'} text-warning fill-warning`} />
            <span className={`${horizontal ? 'text-xs' : 'text-sm'} text-white font-semibold`}>{product.rating || 0}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between font-semibold ${horizontal ? 'text-xs mb-3' : 'text-md mb-4'}`}>
          <span className="text-gray-600 truncate mr-2">{product.category}</span>
          <span className={`shrink-0 ${product.stock > 0 ? 'text-green-500' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        <button
          onClick={(e) => handleAddToCart(e, product)}
          disabled={product.stock === 0}
          className={`w-full btn btn-primary flex items-center justify-center ${horizontal ? 'space-x-1.5 text-xs sm:text-sm py-2' : 'space-x-2'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ShoppingCart className={`${horizontal ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {showAuthToast && (
        <div className="toast toast-warning" role="alert" aria-live="polite">
          You have to login for purchasing the product
        </div>
      )}
      <div className="w-auto mx-auto px-4 py-8">
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
              {/* <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" /> */}
              <button
                type="submit"
                className="absolute right-2 top-[0.30rem] bg-primary text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter */}
          <div ref={categoryDropdownRef} className="relative bg-white rounded-lg">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="input w-full flex items-center justify-between text-left"
            >
              <span>{selectedCategory || 'All Categories'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange('');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      handleCategoryChange(cat);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
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

        {/* Products Display */}
        {showCategoryWiseRows ? (
          <div className="space-y-10">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <section key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                <div className="relative">
                  {categoryScrollState[category]?.canLeft && (
                    <button
                      type="button"
                      onClick={() => handleCategoryRowArrowScroll(category, 'left')}
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 shadow border border-gray-200 p-2 hover:bg-white hidden lg:inline-flex"
                      aria-label={`Scroll ${category} left`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  <div
                    ref={(el) => {
                      categoryRowsRef.current[category] = el;
                    }}
                    onScroll={() => updateCategoryRowScrollState(category)}
                    className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory px-1 sm:px-2 lg:px-10 pt-3 -mt-3 pb-2 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {categoryProducts.map((product) => renderProductCard(product, true))}
                  </div>

                  {categoryScrollState[category]?.canRight && (
                    <button
                      type="button"
                      onClick={() => handleCategoryRowArrowScroll(category, 'right')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/95 shadow border border-gray-200 p-2 hover:bg-white hidden lg:inline-flex"
                      aria-label={`Scroll ${category} right`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product: IProduct) => renderProductCard(product))}
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
