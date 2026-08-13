import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Calendar,
  Search,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  Plus,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'bank_transfer';

interface Transaction {
  id: number;
  description: string;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  classification: 'personal' | 'official';
  category_id?: string | number;
  category_name?: string;
  payment_account_id?: number | null;
  account_name?: string;
  account_type?: AccountType;
  transaction_date: string;
}

interface Category {
  id: number;
  name: string;
  type?: string;
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Wallet size={12} />,
  bank: <Landmark size={12} />,
  upi: <Smartphone size={12} />,
  credit_card: <CreditCard size={12} />,
  bank_transfer: <ArrowLeftRight size={12} />,
};

// Keywords to match home-related expenses
const HOME_KEYWORDS = [
  'rent',
  'grocery',
  'groceries',
  'provisions',
  'electricity',
  'kseb',
  'water',
  'internet',
  'wifi',
  'broadband',
  'gas',
  'lpg',
  'house cleaning',
  'cleaning',
  'maid',
  'home maintenance',
  'home repair',
  'house maintenance',
  'home',
  'household'
];

const EXCLUDE_KEYWORDS = ['fuel', 'petrol', 'diesel', 'vehicle', 'car', 'bike', 'scooter'];

const isHomeCategory = (categoryName: string = '', description: string = ''): boolean => {
  const catLower = categoryName.toLowerCase().trim();
  const descLower = description.toLowerCase().trim();

  // Exclude vehicle/fuel expenses explicitly
  if (EXCLUDE_KEYWORDS.some((k) => catLower.includes(k))) {
    return false;
  }

  // Check category name or description against home keywords
  return (
    HOME_KEYWORDS.some((k) => catLower.includes(k)) ||
    HOME_KEYWORDS.some((k) => descLower.includes(k))
  );
};

const HomeExpenses: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/categories')
      ]);

      setTransactions(txRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error('Error fetching home expenses data:', error);
      toast.error('Failed to load home expense data');
    } finally {
      setLoading(false);
    }
  };

  // Filter ONLY Home Expense transactions (Payment / Expense type)
  const homeTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      return isHomeCategory(t.category_name || '', t.description || '');
    });
  }, [transactions]);

  // Extract unique home category names present or available
  const homeCategories = useMemo(() => {
    const namesSet = new Set<string>();

    // Add existing user categories that are home-related
    categories.forEach((c) => {
      if (isHomeCategory(c.name)) {
        namesSet.add(c.name);
      }
    });

    // Add categories present in home transactions
    homeTransactions.forEach((t) => {
      if (t.category_name) {
        namesSet.add(t.category_name);
      }
    });

    // Ensure common defaults are present for selection
    const defaults = ['Rent', 'Grocery', 'Electricity', 'Water', 'Internet', 'Gas', 'House Cleaning', 'Home Maintenance'];
    defaults.forEach((d) => namesSet.add(d));

    return Array.from(namesSet).sort();
  }, [categories, homeTransactions]);

  // Apply filters (Category, Date, Search)
  const filteredTransactions = useMemo(() => {
    return homeTransactions.filter((tx) => {
      // Category Filter
      if (selectedCategory !== 'all') {
        const catName = (tx.category_name || '').toLowerCase();
        const selName = selectedCategory.toLowerCase();
        if (!catName.includes(selName)) {
          // Fallback check description
          const descName = (tx.description || '').toLowerCase();
          if (!descName.includes(selName)) {
            return false;
          }
        }
      }

      // Search Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesDesc = (tx.description || '').toLowerCase().includes(term);
        const matchesCat = (tx.category_name || '').toLowerCase().includes(term);
        const matchesAccount = (tx.account_name || '').toLowerCase().includes(term);
        if (!matchesDesc && !matchesCat && !matchesAccount) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.transaction_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateRange === 'today') {
          const itemDate = new Date(tx.transaction_date);
          itemDate.setHours(0, 0, 0, 0);
          if (itemDate.getTime() !== today.getTime()) return false;
        } else if (dateRange === 'this_week') {
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          if (txDate < firstDayOfWeek) return false;
        } else if (dateRange === 'this_month') {
          if (
            txDate.getMonth() !== today.getMonth() ||
            txDate.getFullYear() !== today.getFullYear()
          ) {
            return false;
          }
        } else if (dateRange === 'custom') {
          if (startDate && new Date(tx.transaction_date) < new Date(startDate)) return false;
          if (endDate && new Date(tx.transaction_date) > new Date(endDate)) return false;
        }
      }

      return true;
    });
  }, [homeTransactions, selectedCategory, searchTerm, dateRange, startDate, endDate]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCost = filteredTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const today = new Date();
    const thisMonthCost = homeTransactions
      .filter((t) => {
        const d = new Date(t.transaction_date);
        return (
          d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      totalCost,
      thisMonthCost,
      entryCount: filteredTransactions.length
    };
  }, [filteredTransactions, homeTransactions]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-7 h-7 text-indigo-600" />
            <span>Home</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and monitor home-related expenses automatically synced from your transactions.
          </p>
        </div>

        <Link
          to="/voxdbook/transactions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Home Expenses</span>
            <Home className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            ₹{summaryMetrics.totalCost.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-gray-500">
            {selectedCategory !== 'all' ? `Filtered by ${selectedCategory}` : 'Across all home categories'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>This Month</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600">
            ₹{summaryMetrics.thisMonthCost.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-gray-500">Current calendar month total</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>Transactions</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            {summaryMetrics.entryCount}
          </div>
          <p className="text-xs text-gray-500">Total home transaction entries</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search description or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="all">🏷️ All Categories</option>
              {homeCategories.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setDateRange('all');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Home Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <Home className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">No home expenses found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Add a Home-related transaction from the <span className="font-semibold text-gray-700">Transaction List</span> to see it here automatically.
            </p>
            <div className="pt-2">
              <Link
                to="/voxdbook/transactions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Home Expense</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Table Display */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredTransactions.map((tx) => {
                  const accType = tx.account_type || 'cash';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {tx.description || 'Home Expense'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{tx.category_name || 'Home'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.account_name ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {ACCOUNT_ICONS[accType]}
                            <span>{tx.account_name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeExpenses;
