import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { removeFavorite } from '../store/slices/favoriteSlice.js';
import { Heart, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { IProduct } from '../types/index.js';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: favorites } = useAppSelector((state) => state.favorites);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showAuthToast, setShowAuthToast] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Please login to view your favorites</p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = (product: IProduct) => {
    dispatch(
      addToCart({
        productId: product._id || '',
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      })
    );
    setShowAuthToast(true);
    setTimeout(() => setShowAuthToast(false), 2000);
  };

  const handleRemoveFavorite = (productId: string) => {
    dispatch(removeFavorite(productId));
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen py-8">
      {showAuthToast && (
        <div className="toast toast-success" role="alert" aria-live="polite">
          Added to cart successfully!
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">My Favorites</h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-2xl text-gray-600 mb-4">Your favorites list is empty</p>
            <button
              onClick={() => navigate('/products')}
              className="btn btn-primary"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <div key={product._id} className="card group transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl">
                <div
                  onClick={() => handleProductClick(product._id || '')}
                  className="cursor-pointer mb-4 rounded-t-xl flex items-center justify-center overflow-hidden"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>

                <div className='m-4'>
                  <h3
                    onClick={() => handleProductClick(product._id || '')}
                    className="text-xl font-semibold mb-2 cursor-pointer text-white"
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">₹{product.price}</span>
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

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(product._id || '')}
                      className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
