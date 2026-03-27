import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Pencil,
  Trash2
} from 'lucide-react';
import Modal from '../../components/Common/Modal';
import api from '../../services/smartApi';

interface Transaction {
  id: number;
  description: string;
  amount: number | string;
  type: 'income' | 'expense';
  classification: 'personal' | 'official';
  category_id?: string | number;
  category_name?: string;
  transaction_date: string;
}

interface Category {
  id: number;
  name: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    classification: 'official' as 'personal' | 'official',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (tx: Transaction | null = null) => {
    if (tx) {
      setEditingTx(tx);
      setFormData({
        description: tx.description,
        amount: String(tx.amount),
        type: tx.type,
        classification: tx.classification || 'official',
        category_id: String(tx.category_id || ''),
        transaction_date: new Date(tx.transaction_date).toISOString().split('T')[0]
      });
    } else {
      setEditingTx(null);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        classification: 'official',
        category_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}`, formData);
      } else {
        await api.post('/transactions', formData);
      }
      fetchTransactions();
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Error saving transaction: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleQuickAddCategory = async () => {
    const name = window.prompt('Enter new category name:');
    if (!name || !name.trim()) return;

    try {
      const response = await api.post('/categories', { name: name.trim(), type: formData.type });
      const newCategory = response.data;
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, category_id: String(newCategory.id) });
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      alert('Error deleting transaction');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">Manage your income and expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm"
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading transactions...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No transactions found.</td></tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(tx.transaction_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{tx.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                      <Tag size={12} />
                      {tx.category_name || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {tx.classification === 'personal' ? 'Personal' : 'Official'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    ₹{Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                        onClick={() => handleOpenModal(tx)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Section</label>
              <select
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value as 'personal' | 'official' })}
              >
                <option value="official">Official</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Transaction Type</label>
              <select
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex-shrink-0"
                  title="Add new category"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Date</label>
              <input
                type="date"
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Amount (₹)</label>
              <input
                type="number"
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <input
              type="text"
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was this for?"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
            >
              {editingTx ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;
