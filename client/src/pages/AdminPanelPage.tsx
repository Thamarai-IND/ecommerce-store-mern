import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppRedux.js';
import { apiService } from '../services/api.js';
import { Edit2, Trash2, Plus, X, Loader } from 'lucide-react';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export const AdminPanelPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock: 0,
    image: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Only admins can access this page');
      return;
    }

    loadData();
  }, [user, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData.categories || []);

      // Fetch products
      const productsData = selectedCategory
        ? await apiService.getProductsByCategory(selectedCategory, 0, 100)
        : await apiService.getProducts(0, 100);

      setProducts(productsData.products || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.category || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await apiService.updateProduct(editingId, formData);
      } else {
        await apiService.createProduct(formData);
      }

      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        stock: 0,
        image: '',
      });
      setEditingId(null);
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product._id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      await apiService.deleteProduct(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      image: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-red-600">Access denied. Admin only!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Admin Product Management</h1>

        {error && (
          <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex gap-8 mb-8 items-center justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input max-w-[50%] appearance-none pr-4"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      placeholder="e.g., Electronics"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Price *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="input"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      className="input"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Product Image URL</label>
                    <input
                      type="url"
                      value={formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="input"
                      placeholder="https://example.com/product-image.jpg"
                    />
                  </div>
                </div>

                {formData.image && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Image Preview</label>
                    <img
                      src={formData.image}
                      alt="Product preview"
                      className="w-32 h-32 rounded-lg object-cover border"
                      onError={() => setError('Invalid image URL. Please provide a valid public image link.')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {loading && !showForm ? (
            <div className="p-8 text-center">
              <Loader className="w-8 h-8 spinner mx-auto" />
            </div>
          ) : products.length > 0 ? (
            <table className="w-full">
              <thead className="bg-teal-400 h-[5rem] border-b">
                <tr>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Image</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Name</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Category</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Price</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Stock</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold break-words">Description</th>
                  <th className="px-6 py-3 text-center text-lg text-cyan-50 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-w-fit h-20 object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">{product.name}</td>
                    <td className="px-6 py-3 text-sm">{product.category}</td>
                    <td className="px-6 py-3 text-sm font-semibold">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {product.description}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id || '')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600">
              No products found. {!selectedCategory && <button className="text-primary hover:underline">Add a new product</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
