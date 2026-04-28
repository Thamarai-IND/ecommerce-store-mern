import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { loginSuccess, setError } from '../store/slices/authSlice.js';
import { Mail, Lock, User, Loader } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorState('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorState('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorState('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.register(email, password, name);
      dispatch(loginSuccess(response));
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorState(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Register</h1>

        {error && (
          <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="name" className="flex items-center space-x-2">
              <User className="w-5 h-5 text-primary" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Password</span>
            </label>
            <input
              type="password"
              id="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-primary" />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader className="w-5 h-5 spinner" />}
            <span>{loading ? 'Creating account...' : 'Register'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
