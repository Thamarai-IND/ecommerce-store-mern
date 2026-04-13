import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { logout } from '../store/slices/authSlice.js';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { totalItems } = useAppSelector((state) => state.cart);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <span className="text-white text-2xl font-bold">EComerce</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/products" className="text-white hover:text-primary transition">
              Products
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-white hover:text-primary transition">
                Admin
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="text-white hover:text-primary transition">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="relative text-white hover:text-primary transition"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                <div className="relative group">
                  <button className="text-white hover:text-primary transition flex items-center space-x-2">
                    <User className="w-6 h-6" />
                    <span>{user?.name}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-primary hover:text-white"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-danger hover:text-white"
                    >
                      Logout
                    </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-primary transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden bg-gray-700 p-4">
            <Link to="/products" className="block text-white py-2 hover:text-primary">
              Products
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="block text-white py-2 hover:text-primary">
                Admin
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/dashboard" className="block text-white py-2 hover:text-primary">
                Dashboard
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
