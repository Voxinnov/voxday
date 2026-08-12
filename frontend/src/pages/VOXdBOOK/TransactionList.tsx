import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  List,
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  Printer,
  ChevronDown,
  ChevronRight,
  Tag,
  DollarSign
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'bank_transfer';

interface PaymentAccount {
  id: number;
  account_name: string;
  account_type: AccountType;
  bank_name?: string;
  is_default: number;
}

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
  transfer_account_id?: number | null;
  transfer_account_name?: string;
  transfer_account_type?: AccountType;
  transaction_date: string;
}

interface Category {
  id: number;
  name: string;
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Wallet size={12} />,
  bank: <Landmark size={12} />,
  upi: <Smartphone size={12} />,
  credit_card: <CreditCard size={12} />,
  bank_transfer: <ArrowLeftRight size={12} />,
};

const ACCOUNT_COLORS: Record<AccountType, string> = {
  cash: 'bg-emerald-100 text-emerald-700',
  bank: 'bg-blue-100 text-blue-700',
  upi: 'bg-violet-100 text-violet-700',
  credit_card: 'bg-rose-100 text-rose-700',
  bank_transfer: 'bg-amber-100 text-amber-700',
};

const TransactionList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daybook' | 'table'>('daybook');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<'all' | 'official' | 'personal'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Accordion state for Daybook daily groups
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, accRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/categories'),
        api.get('/payment-accounts')
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      setPaymentAccounts(accRes.data);
    } catch (err) {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search
      const searchMatch =
        !searchTerm ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transfer_account_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type
      const typeMatch = filterType === 'all' || tx.type === filterType;

      // Account
      const accountMatch =
        filterAccount === 'all' || String(tx.payment_account_id) === filterAccount || String(tx.transfer_account_id) === filterAccount;

      // Category
      const categoryMatch =
        filterCategory === 'all' || String(tx.category_id) === filterCategory;

      // Section
      const sectionMatch =
        filterSection === 'all' || tx.classification === filterSection;

      // Date Range
      let dateMatch = true;
      const txDateStr = new Date(tx.transaction_date).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      if (dateRange === 'today') {
        dateMatch = txDateStr === todayStr;
      } else if (dateRange === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split('T')[0];
        dateMatch = txDateStr === yestStr;
      } else if (dateRange === 'this_month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateMatch = txDateStr >= firstDay && txDateStr <= todayStr;
      } else if (dateRange === 'custom') {
        if (startDate && txDateStr < startDate) dateMatch = false;
        if (endDate && txDateStr > endDate) dateMatch = false;
      }

      return searchMatch && typeMatch && accountMatch && categoryMatch && sectionMatch && dateMatch;
    });
  }, [transactions, searchTerm, filterType, filterAccount, filterCategory, filterSection, dateRange, startDate, endDate]);

  // Overall totals
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .reduce((sum, t) => {
        if (t.type === 'income') return sum + Number(t.amount);
        if (t.type === 'transfer' && filterAccount !== 'all' && String(t.transfer_account_id) === filterAccount) return sum + Number(t.amount);
        return sum;
      }, 0);
  }, [filteredTransactions, filterAccount]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .reduce((sum, t) => {
        if (t.type === 'expense') return sum + Number(t.amount);
        if (t.type === 'transfer' && filterAccount !== 'all' && String(t.payment_account_id) === filterAccount) return sum + Number(t.amount);
        return sum;
      }, 0);
  }, [filteredTransactions, filterAccount]);

  const netBalance = totalIncome - totalExpense;

  // Group transactions by date for Daybook format
  const groupedByDate = useMemo(() => {
    const groups: Record<string, { date: string; transactions: Transaction[]; dayIncome: number; dayExpense: number }> = {};

    // Sort ascending for calculation, but group order descending
    const sorted = [...filteredTransactions].sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    sorted.forEach(tx => {
      const dateKey = new Date(tx.transaction_date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          transactions: [],
          dayIncome: 0,
          dayExpense: 0,
        };
      }
      groups[dateKey].transactions.push(tx);
      if (tx.type === 'income') {
        groups[dateKey].dayIncome += Number(tx.amount);
      } else {
        groups[dateKey].dayExpense += Number(tx.amount);
      }
    });

    return Object.values(groups);
  }, [filteredTransactions]);

  // Expand all by default when groupedByDate changes
  useEffect(() => {
    const initExpanded: Record<string, boolean> = {};
    groupedByDate.forEach(g => {
      initExpanded[g.date] = true;
    });
    setExpandedDates(initExpanded);
  }, [groupedByDate.length]);

  const toggleDateAccordion = (dateStr: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen animate-fade-in print:bg-white print:p-0">
      {/* Page Header (Hidden in Print) */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={26} /> Daybook & Transaction List
          </h1>
          <p className="text-gray-500 text-sm">View daily ledger accounts, income & expense registers</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold text-sm transition-all shadow-sm"
          >
            <Printer size={16} /> Print / Export
          </button>
        </div>
      </header>

      {/* Navigation Tabs (Hidden in Print) */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('daybook')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'daybook'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BookOpen size={18} /> Daybook Format
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'table'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <List size={18} /> All Transactions List
        </button>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Income (Receipts)</p>
            <p className="text-2xl font-extrabold text-green-600 mt-1">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Expense (Payments)</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Daybook Surplus</p>
            <p className={`text-2xl font-extrabold mt-1 ${netBalance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Hidden in Print) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6 print:hidden space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Filter size={14} /> Filter Transactions & Daybook
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search description..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Section / Classification Filter */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterSection}
            onChange={e => setFilterSection(e.target.value as any)}
          >
            <option value="all">All Classifications (Personal & Official)</option>
            <option value="personal">Personal Only</option>
            <option value="official">Official Only</option>
          </select>

          {/* Date Range Quick Selector */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {/* Type Filter */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types (Income, Expense & Transfer)</option>
            <option value="income">Income Only (Receipts)</option>
            <option value="expense">Expense Only (Payments)</option>
            <option value="transfer">Account Transfers Only</option>
          </select>

          {/* Account Filter */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterAccount}
            onChange={e => setFilterAccount(e.target.value)}
          >
            <option value="all">All Payment Accounts</option>
            {paymentAccounts.map(a => (
              <option key={a.id} value={String(a.id)}>{a.account_name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateRange === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">From:</span>
              <input
                type="date"
                className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                className="py-1.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Header Banner when Printing */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">VOXdBOOK — Daily Daybook Register</h1>
        <p className="text-gray-600 text-sm mt-1">Generated on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'daybook' ? (
        /* ==========================================
           DAYBOOK FORMAT VIEW
        ========================================== */
        <div className="space-y-6">
          {groupedByDate.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-200 shadow-sm">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold text-gray-700">No Daybook Entries Found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or date range</p>
            </div>
          ) : (
            groupedByDate.map(group => {
              const isExpanded = expandedDates[group.date] !== false;
              const formattedDate = new Date(group.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              });

              return (
                <div key={group.date} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border print:shadow-none">
                  {/* Daybook Group Date Header */}
                  <div
                    onClick={() => toggleDateAccordion(group.date)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-base text-gray-900">{formattedDate}</h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {group.transactions.length} entries
                      </span>
                    </div>

                    {/* Day Totals Summary */}
                    <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
                      <span className="text-green-600 flex items-center gap-1">
                        <ArrowUpRight size={14} /> Receipts: ₹{group.dayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-red-600 flex items-center gap-1">
                        <ArrowDownLeft size={14} /> Payments: ₹{group.dayExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Daybook Transactions Ledger Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-100/60 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                            <th className="px-5 py-3">Description</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3">Payment Account</th>
                            <th className="px-5 py-3">Section</th>
                            <th className="px-5 py-3 text-right">Receipt (Income)</th>
                            <th className="px-5 py-3 text-right">Payment (Expense)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {group.transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-gray-900">{tx.description}</td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                                  <Tag size={11} /> {tx.category_name || 'General'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                {tx.type === 'transfer' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                    <span>{tx.account_name || 'Account'}</span>
                                    <ArrowLeftRight size={11} className="text-amber-600 flex-shrink-0" />
                                    <span>{tx.transfer_account_name || 'Account'}</span>
                                  </span>
                                ) : tx.account_name && tx.account_type ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${ACCOUNT_COLORS[tx.account_type]}`}>
                                    {ACCOUNT_ICONS[tx.account_type]}
                                    {tx.account_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                  tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {tx.classification === 'personal' ? 'Personal' : 'Official'}
                                </span>
                              </td>
                              {/* Income Column */}
                              <td className="px-5 py-3.5 text-right font-bold text-green-600">
                                {tx.type === 'income' ? (
                                  `₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                ) : tx.type === 'transfer' && filterAccount === String(tx.transfer_account_id) ? (
                                  <span className="text-amber-700" title="Transfer In">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                ) : tx.type === 'transfer' && filterAccount === 'all' ? (
                                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                                    <ArrowLeftRight size={11} /> ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              {/* Expense Column */}
                              <td className="px-5 py-3.5 text-right font-bold text-red-600">
                                {tx.type === 'expense' ? (
                                  `₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                ) : tx.type === 'transfer' && filterAccount === String(tx.payment_account_id) ? (
                                  <span className="text-amber-700" title="Transfer Out">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/80 font-bold border-t border-gray-200 text-sm">
                          <tr>
                            <td colSpan={4} className="px-5 py-3 text-gray-700">Total for {formattedDate}</td>
                            <td className="px-5 py-3 text-right text-green-700">₹{group.dayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="px-5 py-3 text-right text-red-700">₹{group.dayExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ==========================================
           ALL TRANSACTIONS LIST VIEW
        ========================================== */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Payment Account</th>
                  <th className="px-5 py-3.5">Section</th>
                  <th className="px-5 py-3.5 text-right text-red-600">Expense (Payment)</th>
                  <th className="px-5 py-3.5 text-right text-green-600">Income (Receipt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No transactions found matching your criteria.</td></tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                        {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{tx.description}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                          <Tag size={11} /> {tx.category_name || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {tx.type === 'transfer' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            <span>{tx.account_name || 'Account'}</span>
                            <ArrowLeftRight size={11} className="text-amber-600 flex-shrink-0" />
                            <span>{tx.transfer_account_name || 'Account'}</span>
                          </span>
                        ) : tx.account_name && tx.account_type ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${ACCOUNT_COLORS[tx.account_type]}`}>
                            {ACCOUNT_ICONS[tx.account_type]}
                            {tx.account_name}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.classification === 'personal' ? 'Personal' : 'Official'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                        {tx.type === 'expense' ? (
                          <span className="text-red-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : tx.type === 'transfer' && filterAccount === String(tx.payment_account_id) ? (
                          <span className="text-amber-700 font-bold" title="Transfer Out">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                        {tx.type === 'income' ? (
                          <span className="text-green-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : tx.type === 'transfer' && filterAccount === String(tx.transfer_account_id) ? (
                          <span className="text-amber-700 font-bold" title="Transfer In">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : tx.type === 'transfer' && filterAccount === 'all' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                            <ArrowLeftRight size={11} /> ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 font-medium">
            Showing {filteredTransactions.length} of {transactions.length} total entries
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
