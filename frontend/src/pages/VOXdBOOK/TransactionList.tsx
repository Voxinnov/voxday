import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DollarSign,
  PiggyBank,
  TrendingUp
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
  initial_balance?: number | string;
  current_balance?: number | string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  sub_category?: string;
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
  type?: string;
  sub_category?: string;
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

const MONTH_NAMES = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

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
  const [filterSubCategory, setFilterSubCategory] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<'all' | 'official' | 'personal'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'month' | 'custom'>('all');
  const [selectedMonthName, setSelectedMonthName] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYearNum, setSelectedYearNum] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
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

  const accountMap = useMemo(() => new Map(paymentAccounts.map(a => [a.id, a])), [paymentAccounts]);

  const totalCashBalance = useMemo(() => {
    return paymentAccounts
      .filter(a => a.account_type === 'cash')
      .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
  }, [paymentAccounts]);

  // Extract unique years present in transactions
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    const currentY = String(new Date().getFullYear());
    set.add(currentY);

    transactions.forEach(tx => {
      if (tx.transaction_date) {
        const y = tx.transaction_date.split('-')[0];
        if (y && y.length === 4) set.add(y);
      }
    });

    return Array.from(set).sort().reverse();
  }, [transactions]);

  const isTransferInForFilter = useCallback((tx: Transaction) => {
    if (filterAccount === 'all') return false;
    if (String(tx.transfer_account_id) === filterAccount) return true;
    const selectedAccObj = accountMap.get(Number(filterAccount));
    if (!selectedAccObj || selectedAccObj.account_type === 'upi') return false;
    const chosenTransferBank = ((tx as any).transfer_payment_method || ((tx as any).transfer_bank_name ? (tx as any).transfer_bank_name.split(',')[0].trim() : '')).toLowerCase();
    const bankAccName = selectedAccObj.account_name.toLowerCase();
    const bankNameAttr = selectedAccObj.bank_name ? selectedAccObj.bank_name.toLowerCase() : '';
    return chosenTransferBank !== '' && (chosenTransferBank === bankAccName || (bankNameAttr !== '' && chosenTransferBank === bankNameAttr));
  }, [filterAccount, accountMap]);

  const isTransferOutForFilter = useCallback((tx: Transaction) => {
    if (filterAccount === 'all') return false;
    if (String(tx.payment_account_id) === filterAccount) return true;
    const selectedAccObj = accountMap.get(Number(filterAccount));
    if (!selectedAccObj || selectedAccObj.account_type === 'upi') return false;
    const chosenBank = ((tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name || '').split(',')[0]?.trim() || '').toLowerCase();
    const bankAccName = selectedAccObj.account_name.toLowerCase();
    const bankNameAttr = selectedAccObj.bank_name ? selectedAccObj.bank_name.toLowerCase() : '';
    return chosenBank !== '' && (chosenBank === bankAccName || (bankNameAttr !== '' && chosenBank === bankNameAttr));
  }, [filterAccount, accountMap]);

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
      let accountMatch = true;
      if (filterAccount !== 'all') {
        const isDirect = String(tx.payment_account_id) === filterAccount || String(tx.transfer_account_id) === filterAccount;
        const selectedAccObj = accountMap.get(Number(filterAccount));

        let isLinkedUpi = false;
        if (selectedAccObj && selectedAccObj.account_type !== 'upi') {
          const bankAccName = selectedAccObj.account_name.toLowerCase();
          const bankNameAttr = selectedAccObj.bank_name ? selectedAccObj.bank_name.toLowerCase() : '';

          if (tx.account_type === 'upi') {
            const chosenBank = ((tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name || '').split(',')[0]?.trim() || '').toLowerCase();
            if (chosenBank === bankAccName || (bankNameAttr !== '' && chosenBank === bankNameAttr)) {
              isLinkedUpi = true;
            }
          }

          if ((tx as any).transfer_account_type === 'upi' || (tx as any).transfer_bank_name) {
            const chosenTransferBank = ((tx as any).transfer_payment_method || ((tx as any).transfer_bank_name ? (tx as any).transfer_bank_name.split(',')[0].trim() : '')).toLowerCase();
            if (chosenTransferBank === bankAccName || (bankNameAttr !== '' && chosenTransferBank === bankNameAttr)) {
              isLinkedUpi = true;
            }
          }
        }
        accountMatch = isDirect || isLinkedUpi;
      }

      // Category
      const categoryMatch =
        filterCategory === 'all' || String(tx.category_id) === filterCategory;

      // Sub Category (Investment)
      const subCategoryMatch =
        filterSubCategory === 'all' || tx.sub_category === filterSubCategory;

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
        const currentYM = new Date().toISOString().slice(0, 7);
        dateMatch = txDateStr.startsWith(currentYM);
      } else if (dateRange === 'last_month') {
        const lastM = new Date();
        lastM.setMonth(lastM.getMonth() - 1);
        const lastYM = lastM.toISOString().slice(0, 7);
        dateMatch = txDateStr.startsWith(lastYM);
      } else if (dateRange === 'month') {
        if (selectedMonth) {
          dateMatch = txDateStr.startsWith(selectedMonth);
        }
      } else if (dateRange === 'custom') {
        if (startDate && txDateStr < startDate) dateMatch = false;
        if (endDate && txDateStr > endDate) dateMatch = false;
      }

      return searchMatch && typeMatch && accountMatch && categoryMatch && subCategoryMatch && sectionMatch && dateMatch;
    });
  }, [transactions, searchTerm, filterType, filterAccount, filterCategory, filterSubCategory, filterSection, dateRange, selectedMonth, startDate, endDate, accountMap]);

  // Overall totals
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .reduce((sum, t) => {
        if (t.type === 'income') return sum + Number(t.amount);
        if (t.type === 'transfer') {
          if (filterAccount !== 'all') {
            if (isTransferInForFilter(t)) return sum + Number(t.amount);
          }
        }
        return sum;
      }, 0);
  }, [filteredTransactions, filterAccount, isTransferInForFilter]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .reduce((sum, t) => {
        if (t.type === 'expense') return sum + Number(t.amount);
        if (t.type === 'transfer' && filterAccount !== 'all' && isTransferOutForFilter(t)) {
          return sum + Number(t.amount);
        }
        return sum;
      }, 0);
  }, [filteredTransactions, filterAccount, isTransferOutForFilter]);

  const totalInvestment = useMemo(() => {
    return filteredTransactions
      .reduce((sum, t) => {
        if (t.type === 'expense' && t.sub_category === 'investment') return sum + Number(t.amount);
        return sum;
      }, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense;

  const baseInitialBalance = useMemo(() => {
    if (filterAccount === 'all') {
      return paymentAccounts.reduce(
        (sum, a) => sum + Number(a.initial_balance || 0),
        0
      );
    }
    const selectedAcc = accountMap.get(Number(filterAccount));
    return Number(selectedAcc?.initial_balance || 0);
  }, [filterAccount, paymentAccounts, accountMap]);

  // Compute exact accounting Daybook groups with Opening & Closing Balances per day
  const groupedByDate = useMemo(() => {
    // 1. First, build a map of daily income/expense for ALL transactions prior to date sorting to establish starting opening balance
    // Sort transactions chronologically (oldest to newest)
    const allSorted = [...transactions].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Group filtered transactions by date
    const filteredMap: Record<string, {
      date: string;
      transactions: Transaction[];
      dayIncome: number;
      dayExpense: number;
    }> = {};

    filteredTransactions.forEach(tx => {
      const dateKey = new Date(tx.transaction_date).toISOString().split('T')[0];
      if (!filteredMap[dateKey]) {
        filteredMap[dateKey] = {
          date: dateKey,
          transactions: [],
          dayIncome: 0,
          dayExpense: 0,
        };
      }
      filteredMap[dateKey].transactions.push(tx);

      if (tx.type === 'income') {
        filteredMap[dateKey].dayIncome += Number(tx.amount);
      } else if (tx.type === 'expense') {
        filteredMap[dateKey].dayExpense += Number(tx.amount);
      } else if (tx.type === 'transfer') {
        if (filterAccount !== 'all') {
          if (isTransferInForFilter(tx)) {
            filteredMap[dateKey].dayIncome += Number(tx.amount);
          } else if (isTransferOutForFilter(tx)) {
            filteredMap[dateKey].dayExpense += Number(tx.amount);
          }
        }
      }
    });

    // Determine prior accumulated net balance for dates earlier than the displayed filtered range
    // Sort all dates present in filteredMap chronologically
    const sortedFilteredDates = Object.keys(filteredMap).sort();
    if (sortedFilteredDates.length === 0) return [];

    const earliestFilteredDate = sortedFilteredDates[0];

    // Compute net balance from all transactions before earliestFilteredDate
    let priorBalance = baseInitialBalance;
    allSorted.forEach(tx => {
      const dateKey = new Date(tx.transaction_date).toISOString().split('T')[0];
      if (dateKey < earliestFilteredDate) {
        if (tx.type === 'income') {
          if (filterAccount === 'all' || String(tx.payment_account_id) === filterAccount || String(tx.transfer_account_id) === filterAccount) {
            priorBalance += Number(tx.amount);
          }
        } else if (tx.type === 'expense') {
          if (filterAccount === 'all' || String(tx.payment_account_id) === filterAccount || String(tx.transfer_account_id) === filterAccount) {
            priorBalance -= Number(tx.amount);
          }
        } else if (tx.type === 'transfer' && filterAccount !== 'all') {
          if (isTransferInForFilter(tx)) {
            priorBalance += Number(tx.amount);
          } else if (isTransferOutForFilter(tx)) {
            priorBalance -= Number(tx.amount);
          }
        }
      }
    });

    // Process filtered dates chronologically to guarantee exact daily continuity:
    // Opening(D) = RunningBalance
    // Closing(D) = Opening(D) + Receipts(D) - Payments(D)
    let runningBalance = priorBalance;
    const dailyGroupsChronological: Array<{
      date: string;
      transactions: Transaction[];
      dayIncome: number;
      dayExpense: number;
      openingBalance: number;
      closingBalance: number;
    }> = [];

    sortedFilteredDates.forEach(dateKey => {
      const groupData = filteredMap[dateKey];
      const openingBalance = runningBalance;
      const closingBalance = openingBalance + groupData.dayIncome - groupData.dayExpense;
      runningBalance = closingBalance;

      dailyGroupsChronological.push({
        ...groupData,
        openingBalance,
        closingBalance,
      });
    });

    // Return descending (newest date first for ledger display)
    return dailyGroupsChronological.reverse();
  }, [transactions, filteredTransactions, filterAccount, baseInitialBalance, isTransferInForFilter, isTransferOutForFilter]);

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
          <p className="text-gray-500 text-sm">View daily accounting ledgers with Opening & Closing balances</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Total Cash Balance</p>
            <p className="text-2xl font-black mt-1">₹{totalCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-emerald-100/80 mt-0.5">Physical cash in hand</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>

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

        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm bg-gradient-to-br from-white to-emerald-50/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
              <PiggyBank size={14} className="text-emerald-600" /> Total Investment
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Expense section investments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {filterAccount !== 'all' ? 'Account Closing Balance' : 'Total Closing Balance'}
            </p>
            <p className={`text-2xl font-extrabold mt-1 ${(baseInitialBalance + netBalance) >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              ₹{(baseInitialBalance + netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              Opening ₹{baseInitialBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })} + Net Surplus {netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(baseInitialBalance + netBalance) >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Hidden in Print) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6 print:hidden space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Filter size={14} /> Filter Transactions & Daybook
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
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
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            value={dateRange}
            onChange={e => {
              const val = e.target.value as any;
              setDateRange(val);
              if (val === 'this_month') {
                const now = new Date();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = String(now.getFullYear());
                setSelectedMonthName(m);
                setSelectedYearNum(y);
                setSelectedMonth(`${y}-${m}`);
              } else if (val === 'last_month') {
                const lm = new Date();
                lm.setMonth(lm.getMonth() - 1);
                const m = String(lm.getMonth() + 1).padStart(2, '0');
                const y = String(lm.getFullYear());
                setSelectedMonthName(m);
                setSelectedYearNum(y);
                setSelectedMonth(`${y}-${m}`);
              }
            }}
          >
            <option value="all">📅 All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="month">🗓️ Filter by Month Name...</option>
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

          {/* Sub Category Filter (Investment) */}
          <select
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            value={filterSubCategory}
            onChange={e => setFilterSubCategory(e.target.value)}
          >
            <option value="all">All Sub-Categories</option>
            <option value="investment">Investment Only</option>
            <option value="general">General Expenses Only</option>
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

        {/* Month Name & Year Selector UI when Filter by Month is active */}
        {dateRange === 'month' && (
          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={14} className="text-indigo-600" /> Select Month:
                </span>
                <select
                  className="py-1.5 px-3 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  value={selectedMonthName}
                  onChange={e => {
                    const m = e.target.value;
                    setSelectedMonthName(m);
                    setSelectedMonth(`${selectedYearNum}-${m}`);
                  }}
                >
                  {MONTH_NAMES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Year:</span>
                <select
                  className="py-1.5 px-3 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  value={selectedYearNum}
                  onChange={e => {
                    const y = e.target.value;
                    setSelectedYearNum(y);
                    setSelectedMonth(`${y}-${selectedMonthName}`);
                  }}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                Filtered: {MONTH_NAMES.find(m => m.value === selectedMonthName)?.label} {selectedYearNum}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {MONTH_NAMES.map(m => {
                const isSelected = selectedMonthName === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonthName(m.value);
                      setSelectedMonth(`${selectedYearNum}-${m.value}`);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-900'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
           DAYBOOK FORMAT VIEW (WITH ACCURATE OPENING & CLOSING BALANCES)
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
                  {/* Daybook Group Date Header with Opening & Closing Balances */}
                  <div
                    onClick={() => toggleDateAccordion(group.date)}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors gap-3"
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

                    {/* Day Balance Summary Badges (Opening, Income, Expense, Closing) */}
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold">
                      {/* Opening Balance Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                        <span className="text-gray-500 font-normal">Opening Bal (B/F):</span>
                        <span className="font-black text-blue-800">₹{group.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </span>

                      {/* Receipts */}
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                        <ArrowUpRight size={14} /> Receipts: ₹{group.dayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>

                      {/* Payments */}
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                        <ArrowDownLeft size={14} /> Payments: ₹{group.dayExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>

                      {/* Closing Balance Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-950 border border-indigo-200">
                        <span className="text-gray-500 font-normal">Closing Bal (C/F):</span>
                        <span className="font-black text-indigo-900">₹{group.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Daybook Transactions Ledger Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-gray-100/80 text-xs font-bold text-gray-600 uppercase">
                            <th className="px-5 py-3 border border-gray-200">Description / Ledger Details</th>
                            <th className="px-5 py-3 border border-gray-200">Category</th>
                            <th className="px-5 py-3 border border-gray-200">Payment Account</th>
                            <th className="px-5 py-3 border border-gray-200">Section</th>
                            <th className="px-5 py-3 text-right border border-gray-200 text-green-700">Receipt (Income)</th>
                            <th className="px-5 py-3 text-right border border-gray-200 text-red-700">Payment (Expense)</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {/* 1. Explicit OPENING BALANCE (B/F) Row */}
                          <tr className="bg-blue-50/60 font-bold border-b-2 border-blue-200 text-blue-950">
                            <td colSpan={4} className="px-5 py-3 border border-gray-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                                OPENING BALANCE (Brought Forward / B/F) for {formattedDate}
                              </span>
                            </td>
                            <td colSpan={2} className="px-5 py-3 text-right border border-gray-200 font-black text-blue-900 text-base">
                              ₹{group.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {/* 2. Daily Transactions Rows */}
                          {group.transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5 font-semibold text-gray-900 border border-gray-200">{tx.description}</td>
                              <td className="px-5 py-3.5 border border-gray-200">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                                    <Tag size={11} /> {tx.category_name || 'General'}
                                  </span>
                                  {tx.sub_category === 'investment' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                      <TrendingUp size={10} /> Investment
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 border border-gray-200">
                                {tx.type === 'transfer' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                    <span>
                                      {tx.account_name || 'Account'}
                                      {tx.account_type === 'upi' && ((tx as any).payment_method || accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name) && (
                                        <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200/80 text-violet-950">
                                          🏦 {(tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name)?.split(',')[0]?.trim()}
                                        </span>
                                      )}
                                    </span>
                                    <ArrowLeftRight size={11} className="text-amber-600 flex-shrink-0" />
                                    <span>
                                      {tx.transfer_account_name || 'Account'}
                                      {((tx as any).transfer_account_type === 'upi' || (tx as any).transfer_bank_name) && ((tx as any).transfer_payment_method || (tx as any).transfer_bank_name) && (
                                        <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950">
                                          🏦 {(tx as any).transfer_payment_method || ((tx as any).transfer_bank_name)?.split(',')[0]?.trim()}
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                ) : tx.account_name && tx.account_type ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${ACCOUNT_COLORS[tx.account_type]}`}>
                                    {ACCOUNT_ICONS[tx.account_type]}
                                    {tx.account_name}
                                    {tx.account_type === 'upi' && ((tx as any).payment_method || accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name) && (
                                      <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200/80 text-violet-950">
                                        🏦 {(tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name)?.split(',')[0]?.trim()}
                                      </span>
                                    )}
                                    {tx.payment_account_id && accountMap.get(tx.payment_account_id)?.current_balance !== undefined && (
                                      <span className="opacity-75 font-semibold text-[10px]">
                                        (₹{Number(accountMap.get(tx.payment_account_id)?.current_balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 border border-gray-200">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                  tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {tx.classification === 'personal' ? 'Personal' : 'Official'}
                                </span>
                              </td>
                              {/* Income Column */}
                              <td className="px-5 py-3.5 text-right font-bold text-green-600 border border-gray-200">
                                {tx.type === 'income' ? (
                                  `₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                ) : tx.type === 'transfer' && isTransferInForFilter(tx) ? (
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
                              <td className="px-5 py-3.5 text-right font-bold text-red-600 border border-gray-200">
                                {tx.type === 'expense' ? (
                                  `₹${Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                ) : tx.type === 'transfer' && isTransferOutForFilter(tx) ? (
                                  <span className="text-amber-700" title="Transfer Out">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {/* Table Footer: Daily Totals & CLOSING BALANCE (C/F) */}
                        <tfoot className="font-bold text-sm">
                          <tr className="bg-gray-100/70 border-t border-gray-200 text-gray-800">
                            <td colSpan={4} className="px-5 py-3 border border-gray-200">Total Receipts & Payments for {formattedDate}</td>
                            <td className="px-5 py-3 border border-gray-200 text-right text-green-700 font-extrabold">₹{group.dayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="px-5 py-3 border border-gray-200 text-right text-red-700 font-extrabold">₹{group.dayExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>

                          {/* 3. Explicit CLOSING BALANCE (C/F) Row */}
                          <tr className="bg-indigo-100/70 border-t-2 border-indigo-300 text-indigo-950 font-black">
                            <td colSpan={4} className="px-5 py-3 border border-indigo-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-700"></span>
                                CLOSING BALANCE (Carried Forward / C/F) for {formattedDate}
                              </span>
                            </td>
                            <td colSpan={2} className="px-5 py-3 text-right border border-indigo-200 text-indigo-900 text-base font-black">
                              ₹{group.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
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
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-5 py-3.5 border border-gray-200">Date</th>
                  <th className="px-5 py-3.5 border border-gray-200">Description</th>
                  <th className="px-5 py-3.5 border border-gray-200">Category</th>
                  <th className="px-5 py-3.5 border border-gray-200">Payment Account</th>
                  <th className="px-5 py-3.5 border border-gray-200">Section</th>
                  <th className="px-5 py-3.5 text-right text-red-600 border border-gray-200">Expense (Payment)</th>
                  <th className="px-5 py-3.5 text-right text-green-600 border border-gray-200">Income (Receipt)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No transactions found matching your criteria.</td></tr>
                ) : (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap font-medium border border-gray-200">
                        {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 border border-gray-200">{tx.description}</td>
                      <td className="px-5 py-3.5 border border-gray-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                            <Tag size={11} /> {tx.category_name || 'General'}
                          </span>
                          {tx.sub_category === 'investment' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                              <TrendingUp size={10} /> Investment
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 border border-gray-200">
                        {tx.type === 'transfer' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            <span>
                              {tx.account_name || 'Account'}
                              {tx.account_type === 'upi' && ((tx as any).payment_method || accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name) && (
                                <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200/80 text-violet-950">
                                  🏦 {(tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name)?.split(',')[0]?.trim()}
                                </span>
                              )}
                            </span>
                            <ArrowLeftRight size={11} className="text-amber-600 flex-shrink-0" />
                            <span>
                              {tx.transfer_account_name || 'Account'}
                              {((tx as any).transfer_account_type === 'upi' || (tx as any).transfer_bank_name) && ((tx as any).transfer_payment_method || (tx as any).transfer_bank_name) && (
                                <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950">
                                  🏦 {(tx as any).transfer_payment_method || ((tx as any).transfer_bank_name)?.split(',')[0]?.trim()}
                                </span>
                              )}
                            </span>
                          </span>
                        ) : tx.account_name && tx.account_type ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${ACCOUNT_COLORS[tx.account_type]}`}>
                            {ACCOUNT_ICONS[tx.account_type]}
                            {tx.account_name}
                            {tx.account_type === 'upi' && ((tx as any).payment_method || accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name) && (
                              <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200/80 text-violet-950">
                                🏦 {(tx as any).payment_method || (accountMap.get(tx.payment_account_id || 0)?.bank_name || (tx as any).bank_name)?.split(',')[0]?.trim()}
                              </span>
                            )}
                            {tx.payment_account_id && accountMap.get(tx.payment_account_id)?.current_balance !== undefined && (
                              <span className="opacity-75 font-semibold text-[10px]">
                                (₹{Number(accountMap.get(tx.payment_account_id)?.current_balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 border border-gray-200">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.classification === 'personal' ? 'Personal' : 'Official'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap border border-gray-200">
                        {tx.type === 'expense' ? (
                          <span className="text-red-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : tx.type === 'transfer' && isTransferOutForFilter(tx) ? (
                          <span className="text-amber-700 font-bold" title="Transfer Out">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap border border-gray-200">
                        {tx.type === 'income' ? (
                          <span className="text-green-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : tx.type === 'transfer' && isTransferInForFilter(tx) ? (
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
