import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

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

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('expense');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const response = await api.post('/categories', { name: newName.trim(), type: newType });
      setCategories([...categories, response.data]);
      setNewName('');
      setNewType('expense');
      setIsAdding(false);
      toast.success('Category created successfully!');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditType(cat.type || 'expense');
    setIsAdding(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;
    try {
      await api.put(`/categories/${editingCat.id}`, { name: editName.trim(), type: editType });
      setCategories(categories.map(c => c.id === editingCat.id ? { ...c, name: editName.trim(), type: editType } : c));
      setEditingCat(null);
      toast.success('Category updated successfully!');
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? Transactions using it will become uncategorized.`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      setCategories(categories.filter(c => c.id !== cat.id));
      toast.success('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-500 text-sm">Organize your income, expense, and transfer categories</p>
        </div>
        {!isAdding && !editingCat && (
          <button 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={18} />
            New Category
          </button>
        )}
      </header>

      {/* Form for Creating Category */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-8 animate-fade-in">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" /> Add New Category
          </h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Name *</label>
                <input 
                  type="text" 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Shopping, Bills, Work, Account Transfer"
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Type *</label>
                <select 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value)}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
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

      {/* Form for Editing Category */}
      {editingCat && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200 mb-8 animate-fade-in ring-2 ring-indigo-400/20">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Edit2 size={18} className="text-indigo-600" /> Edit Category
          </h2>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Name *</label>
                <input 
                  type="text" 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  autoFocus
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Category Type *</label>
                <select 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                  value={editType} 
                  onChange={(e) => setEditType(e.target.value)}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setEditingCat(null)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <Tag size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">No categories found. Create your first one!</p>
          </div>
        ) : categories.map(cat => {
          const isSelectedForEdit = editingCat?.id === cat.id;
          return (
            <div 
              key={cat.id} 
              className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between hover:shadow-md transition-all ${
                isSelectedForEdit ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100'
              }`}
            >
              <div className="flex gap-4 items-center mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  cat.type === 'income' 
                    ? 'bg-green-50 text-green-600' 
                    : cat.type === 'transfer' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{cat.name}</h3>
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    cat.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : cat.type === 'transfer'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {cat.type}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                <button 
                  className="p-2 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors" 
                  onClick={() => handleStartEdit(cat)}
                  title="Edit Category"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors" 
                  onClick={() => handleDelete(cat)} 
                  title="Delete Category"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
