import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header.js';
import { useAppSelector } from './hooks/useAppRedux.js';
import {
  LoginPage,
  RegisterPage,
  ProductsPage,
  CartPage,
  DashboardPage,
  AdminPanelPage,
} from './pages/index.js';

// Home page component
const Home: React.FC = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold mb-4">Welcome to E-Commerce</h1>
    <p className="text-xl text-gray-600 mb-8">Start shopping now!</p>
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products" element={<ProductsPage />} />

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
