import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/smartApi';

interface Category {
  id: number;
  name: string;
  type: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('expense');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await api.post('/categories', { name: newName, type: newType });
      setCategories([...categories, response.data]);
      setNewName('');
      setNewType('expense');
      setIsAdding(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category? Transactions using it will be uncategorized.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-500 text-sm">Organize your transactions and tasks</p>
        </div>
        {!isAdding && (
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={18} />
            New Category
          </button>
        )}
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 animate-fade-in">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Name</label>
                <input 
                  type="text" 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Shopping, Bills, Work"
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Type</label>
                <select 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <Tag size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">No categories found. Create your first one!</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex gap-4 items-center mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                cat.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                <Tag size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {cat.type}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" title="Edit">
                <Edit2 size={18} />
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors" 
                onClick={() => handleDelete(cat.id)} 
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
