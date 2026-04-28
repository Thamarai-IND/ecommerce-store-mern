import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppRedux.js';
import { logout } from '../store/slices/authSlice.js';
import { ShoppingCart, Menu, X, User, Heart, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { totalItems } = useAppSelector((state) => state.cart);
  const totalFavorites = useAppSelector((state) => state.favorites.items.length);

  const handleLogout = () => {
    setIsMenuOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-white text-xl sm:text-2xl font-bold">E-commerce</span>
          </Link>

          {/* Desktop Navigation (lg+) */}
          <nav className="hidden lg:flex space-x-8">
            <Link
              to="/products"
              className="text-white font-bold px-2 py-1 hover:bg-green-400 hover:rounded hover:text-white transition"
            >
              Products
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-white font-bold px-2 py-1 hover:bg-green-400 hover:rounded hover:text-white transition"
              >
                Admin
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/dashboard"
                className="text-white font-bold px-2 py-1 hover:bg-green-400 hover:rounded hover:text-white transition"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side — Desktop account icons (lg+) */}
          <div className="flex items-center space-x-4">
            {/* Cart & Favorites — always visible when authenticated */}
            {isAuthenticated && (
              <>
                <Link
                  to="/favorites"
                  className="relative text-white hover:text-red-400 transition"
                  title="Favorites"
                >
                  <Heart className="w-6 h-6" />
                  {totalFavorites > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {totalFavorites > 99 ? '99+' : totalFavorites}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="relative text-white hover:text-primary transition"
                  title="Cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Desktop account dropdown (lg+) */}
            {isAuthenticated ? (
              <div className="relative group hidden lg:block">
                <button className="text-white hover:text-primary transition flex items-center space-x-2">
                  <User className="w-6 h-6" />
                  <span className="max-w-[120px] truncate">{user?.name}</span>
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
            ) : (
              <div className="hidden lg:flex items-center space-x-4">
                <Link to="/login" className="text-white hover:text-primary transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Hamburger — visible on mobile & tablet (< lg) */}
            <div className="lg:hidden relative" ref={menuRef}>
              <button
                className="text-white p-1 rounded hover:bg-slate-800 transition"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 rounded-xl shadow-2xl overflow-hidden z-50 border border-slate-700">
                  {/* Nav links */}
                  <div className="border-b border-slate-700">
                    <Link
                      to="/products"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-slate-700 transition"
                    >
                      <ShoppingCart className="w-4 h-4 text-green-400" />
                      Products
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-slate-700 transition"
                      >
                        <Shield className="w-4 h-4 text-yellow-400" />
                        Admin
                      </Link>
                    )}
                    {isAuthenticated && user?.role === 'admin' && (
                      <Link
                        to="/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-slate-700 transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                        Dashboard
                      </Link>
                    )}
                  </div>

                  {/* Account section */}
                  {isAuthenticated ? (
                    <div>
                      <div className="px-4 py-3 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <User className="w-4 h-4" />
                          <span className="truncate font-medium text-white">{user?.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-slate-700 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-700 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <Link
                        to="/login"
                        onClick={closeMenu}
                        className="block text-center w-full py-2 rounded-lg text-white hover:bg-slate-700 transition"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeMenu}
                        className="block text-center w-full py-2 rounded-lg bg-primary text-white hover:bg-blue-600 transition"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
