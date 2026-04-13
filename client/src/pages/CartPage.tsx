import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { removeFromCart, incrementQuantity, decrementQuantity, clearCart } from '../store/slices/cartSlice.js';
import { apiService } from '../services/api.js';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, totalItems } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleIncrement = (productId: string) => {
    dispatch(incrementQuantity(productId));
  };

  const handleDecrement = (productId: string) => {
    dispatch(decrementQuantity(productId));
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = await apiService.createOrder(orderItems, totalPrice, 'credit_card');
      dispatch(clearCart());
      navigate('/orders/' + order._id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Checkout failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add products to your cart to get started</p>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        {error && (
          <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="card flex gap-6">
                {/* Product Image */}
                <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">${item.price}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() => handleDecrement(item.productId)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrement(item.productId)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price and Remove */}
                <div className="flex flex-col items-end justify-between">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-danger hover:bg-red-50 p-2 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 border-b pb-4">
              <div className="flex justify-between">
                <span>Items ({totalItems})</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(totalPrice * 0.1).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between mb-6 text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">${(totalPrice * 1.1).toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>

            <button
              onClick={() => navigate('/products')}
              className="w-full btn btn-outline mt-4"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
