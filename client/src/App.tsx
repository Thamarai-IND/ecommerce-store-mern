import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header.js';
import { useAppSelector } from './hooks/useAppRedux.js';
import {
  LoginPage,
  RegisterPage,
  ProductsPage,
  ProductDetailPage,
  FavoritesPage,
  CartPage,
  DashboardPage,
  AdminPanelPage,
} from './pages/index.js';

// Home page component
const Home: React.FC = () => (
  <div>
    {/* Hero Section */}
    <div className="text-center py-20 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg mb-12">
      <h1 className="text-5xl font-bold mb-4">Welcome to E-Commerce</h1>
      <p className="text-xl text-gray-600 mb-8">Discover amazing products at unbeatable prices</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => window.location.href = '/products'} className="btn btn-primary">
          Browse Products
        </button>
        {!localStorage.getItem('token') && (
          <button onClick={() => window.location.href = '/login'} className="btn btn-outline">
            Login
          </button>
        )}
      </div>
    </div>

    {/* Features Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-4xl mb-3">🚚</div>
        <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
        <p className="text-gray-600">Experience quick and reliable delivery to your doorstep</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-4xl mb-3">💰</div>
        <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
        <p className="text-gray-600">Competitive pricing on a wide range of products</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-4xl mb-3">🛡️</div>
        <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
        <p className="text-gray-600">Shop with confidence with our secure payment options</p>
      </div>
    </div>

    {/* Promotional Banner */}
    <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg p-8 mb-12 text-center">
      <h2 className="text-3xl font-bold mb-3">Special Offer!</h2>
      <p className="text-lg mb-4">Get up to 30% off on selected products</p>
      <button onClick={() => window.location.href = '/products'} className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
        Shop Now
      </button>
    </div>

    {/* Why Choose Us Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div>
        <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✓</span>
            <span className="text-gray-700">Wide selection of premium products</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✓</span>
            <span className="text-gray-700">Easy returns and exchanges</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✓</span>
            <span className="text-gray-700">24/7 customer support</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✓</span>
            <span className="text-gray-700">Exclusive member deals</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-500 text-2xl">✓</span>
            <span className="text-gray-700">Free shipping on orders above ₹500</span>
          </li>
        </ul>
      </div>
      <div className="bg-gradient-to-br from-blue-400 to-teal-400 rounded-lg p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold mb-3">10K+</p>
          <p className="text-xl">Customers Happy & Satisfied</p>
        </div>
      </div>
    </div>

    {/* CTA Section */}
    <div className="text-center bg-gray-50 rounded-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Ready to Start Shopping?</h2>
      <button onClick={() => window.location.href = '/products'} className="btn btn-primary">
        Browse Our Collection
      </button>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'user' }> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <main className="min-w-80 mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />

            {/* Protected user routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
