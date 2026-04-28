import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { addToCart } from '../store/slices/cartSlice.js';
import { addFavorite, removeFavorite } from '../store/slices/favoriteSlice.js';
import { ArrowLeft, Heart, ShoppingCart, Star } from 'lucide-react';
import { IProduct } from '../types/index.js';

interface ProductFeedbackSummary {
  averageRating: number;
  reviewCount: number;
}

interface ProductFeedbackReview {
  userId: string;
  userName: string;
  rating?: number;
  review?: string;
  createdAt?: string;
}

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { favoriteIds } = useAppSelector((state) => state.favorites);
  
  const [product, setProduct] = useState<IProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [feedbackSummary, setFeedbackSummary] = useState<ProductFeedbackSummary>({ averageRating: 0, reviewCount: 0 });
  const [feedbackReviews, setFeedbackReviews] = useState<ProductFeedbackReview[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setError('Product not found');
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getProductById(productId);
        setProduct(data.data ? data.data[0] : data);
        setIsFavorite(favoriteIds.includes(productId));
        const summary = await apiService.getProductFeedbackSummary(productId);
        setFeedbackSummary(summary);
      } catch (err) {
        setError('Failed to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, favoriteIds]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    dispatch(
      addToCart({
        productId: product._id || '',
        name: product.name,
        price: product.price,
        quantity,
        stock: product.stock,
        image: product.image,
        userRating: userRating > 0 ? userRating : undefined,
        userReview: userReview.trim() || undefined,
      })
    );
    alert('Added to cart!');
  };

  const handleToggleReviews = async () => {
    if (!product?._id) return;

    const nextShowReviews = !showReviews;
    setShowReviews(nextShowReviews);

    if (nextShowReviews && feedbackReviews.length === 0) {
      try {
        setReviewsLoading(true);
        const reviews = await apiService.getProductFeedbackReviews(product._id);
        setFeedbackReviews(reviews);
      } catch (err) {
        console.error('Failed to load product reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    if (!isAuthenticated) {
      alert('Please login to add favorites');
      navigate('/login');
      return;
    }

    if (isFavorite) {
      dispatch(removeFavorite(product._id || ''));
      setIsFavorite(false);
    } else {
      dispatch(addFavorite(product));
      setIsFavorite(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const images = product.image ? [product.image] : [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery - Left Side */}
          <div>
            {/* Main Image */}
            <div className="bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400">No image available</span>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIndex === idx ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details - Right Side */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <span className="font-semibold">{feedbackSummary.averageRating.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleReviews}
                    className="text-gray-600 hover:text-primary hover:underline"
                  >
                    ({feedbackSummary.reviewCount} reviews)
                  </button>
                </div>
              </div>
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Heart
                  className={`w-6 h-6 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-primary mb-2">₹{product.price}</p>
              <p className="text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-3 py-2 border border-gray-300 rounded text-center"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-3">Your Review (Optional)</h3>
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Your Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUserRating((prev) => (prev === value ? 0 : value))}
                      className="p-1"
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 ${value <= userRating ? 'text-warning fill-warning' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="user-review" className="block text-sm text-gray-600 mb-2">
                  Write a review
                </label>
                <textarea
                  id="user-review"
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Share your thoughts about this product"
                  className="input min-h-24"
                  maxLength={1000}
                />
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full btn btn-primary flex items-center justify-center gap-2 py-3 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
              <p>✓ Free delivery on orders above ₹500</p>
              <p>✓ Easy returns & exchanges</p>
              <p>✓ Secure payment options</p>
            </div>
          </div>
        </div>

        {showReviews && (
          <div className="mt-10 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Product Reviews</h2>
            {reviewsLoading ? (
              <p className="text-gray-600">Loading reviews...</p>
            ) : feedbackReviews.length > 0 ? (
              <div className="space-y-4">
                {feedbackReviews.map((review, index) => (
                  <div key={`${review.userId}-${review.createdAt || index}`} className="border-b pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900">{review.userName}</p>
                      {review.createdAt && (
                        <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {typeof review.rating === 'number' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="text-sm font-medium">{review.rating.toFixed(1)} / 5</span>
                      </div>
                    )}
                    <p className="text-gray-700">{review.review || 'No written review provided.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No reviews yet for this product.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
