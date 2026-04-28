import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { CacheService } from '../utils/cache.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, IndianRupee, TrendingUp, Calendar } from 'lucide-react';

interface CategoryStat {
  category: string;
  totalRevenue: number;
  totalQuantity: number;
}

interface ProductRatingStat {
  _id: string;
  productName: string;
  avgRating: number;
  totalReviews: number;
  category: string;
}

interface ProductRevenueStat {
  productId: string;
  productName: string;
  category: string;
  totalRevenue: number;
  totalQuantity: number;
}

interface CategorySalesResponse {
  categorySales: CategoryStat[];
  productRevenue: ProductRevenueStat[];
}

export const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [productRevenueStats, setProductRevenueStats] = useState<ProductRevenueStat[]>([]);
  const [productRatingStats, setProductRatingStats] = useState<ProductRatingStat[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Try cache first
        const cachedStats = CacheService.get(`dashboard:${user._id}`);
        if (cachedStats) {
          setStats(cachedStats);
        }

        // Fetch dashboard stats
        const dashboardData = await apiService.getDashboardStats(user._id || '');
        setStats(dashboardData);
        CacheService.set(`dashboard:${user._id}`, dashboardData, 1000 * 60 * 5); // 5 minutes

        // Fetch category stats if admin
        if (user.role === 'admin') {
          const cachedCategorySales = CacheService.get<CategorySalesResponse>('category:sales:stats');
          if (cachedCategorySales) {
            setCategoryStats(cachedCategorySales.categorySales || []);
            setProductRevenueStats(cachedCategorySales.productRevenue || []);
          }

          const categorySalesData = await apiService.getCategoryWiseSalesStats();
          setCategoryStats(categorySalesData.categorySales || []);
          setProductRevenueStats(categorySalesData.productRevenue || []);
          CacheService.set('category:sales:stats', categorySalesData, 1000 * 60 * 10); // 10 minutes

          const cachedProductRatingStats = CacheService.get<ProductRatingStat[]>('product:rating:stats');
          if (cachedProductRatingStats) {
            setProductRatingStats(cachedProductRatingStats);
          }

          const productRatingData = await apiService.getProductWiseRatingStats() as ProductRatingStat[];
          setProductRatingStats(productRatingData);
          CacheService.set('product:rating:stats', productRatingData, 1000 * 60 * 10); // 10 minutes
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-screen">No data available</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-white inline-grid p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Products Bought</p>
                <p className="text-3xl font-bold">{stats.totalProductsBought}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-white  inline-grid p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Amount Spent</p>
                <p className="text-3xl font-bold">₹{stats.totalAmountSpent?.toFixed(2) || 0}</p>
              </div>
              <IndianRupee className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-white inline-grid p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold">{stats.ordersCount}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="card bg-white inline-grid p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Order Value</p>
                <p className="text-3xl font-bold">
                  ₹{stats.ordersCount > 0 ? (stats.totalAmountSpent / stats.ordersCount).toFixed(2) : 0}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
          {stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{order._id?.substring(0, 8)}...</td>
                      <td className="px-6 py-3 text-sm font-semibold">₹{order.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">{order.items?.length || 0} items</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No orders yet</p>
          )}
        </div>

        {/* Category Stats (Admin Only) */}
        {user?.role === 'admin' && (categoryStats.length > 0 || productRevenueStats.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, totalQuantity }: CategoryStat) => `${category}: ${totalQuantity}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalQuantity"
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Revenue by Product (Category + Product)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={productRevenueStats}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'totalRevenue') return [`₹${Number(value).toFixed(2)}`, 'Revenue'];
                      if (name === 'totalQuantity') return [value, 'Quantity'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      if (!item) return label;
                      return `${item.category} - ${item.productName}`;
                    }}
                  />
                  <Bar dataKey="totalRevenue">
                    {productRevenueStats.map((_, index) => (
                      <Cell key={`revenue-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {productRatingStats.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">Average Rating by Product</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={productRatingStats}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'avgRating') return [`${Number(value).toFixed(2)} / 5`, 'Avg Rating'];
                        if (name === 'totalReviews') return [value, 'Reviews'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        if (!item) return label;
                        return `${item.category} - ${item.productName}`;
                      }}
                    />
                    <Bar dataKey="avgRating">
                      {productRatingStats.map((_, index) => (
                        <Cell key={`rating-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
