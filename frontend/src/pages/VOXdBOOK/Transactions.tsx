import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Pencil,
  Trash2,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  ArrowLeft,
  Check,
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
  current_balance?: number | string;
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
  cash: <Wallet size={16} />,
  bank: <Landmark size={16} />,
  upi: <Smartphone size={16} />,
  credit_card: <CreditCard size={16} />,
  bank_transfer: <ArrowLeftRight size={16} />,
};

const ACCOUNT_COLORS: Record<AccountType, string> = {
  cash: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  bank: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  upi: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100',
  credit_card: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
  bank_transfer: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
};

const ACCOUNT_SELECTED_COLORS: Record<AccountType, string> = {
  cash: 'bg-emerald-100 border-emerald-600 text-emerald-900 ring-2 ring-emerald-400/30',
  bank: 'bg-blue-100 border-blue-600 text-blue-900 ring-2 ring-blue-400/30',
  upi: 'bg-violet-100 border-violet-600 text-violet-900 ring-2 ring-violet-400/30',
  credit_card: 'bg-rose-100 border-rose-600 text-rose-900 ring-2 ring-rose-400/30',
  bank_transfer: 'bg-amber-100 border-amber-600 text-amber-900 ring-2 ring-amber-400/30',
};

const Transactions: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterClassification, setFilterClassification] = useState<string>('');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    classification: 'personal' as 'personal' | 'official',
    category_id: '',
    vehicle_id: '',
    trip_id: '',
    payment_account_id: '',
    transfer_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchPaymentAccounts();
    fetchVehicles();
    fetchTrips();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips');
      setTrips(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

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

  const fetchPaymentAccounts = async () => {
    try {
      const response = await api.get('/payment-accounts');
      setPaymentAccounts(response.data);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      !searchTerm ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transfer_account_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = filterAccount
      ? String(tx.payment_account_id) === filterAccount || String(tx.transfer_account_id) === filterAccount
      : true;
    const matchesClassification = filterClassification
      ? tx.classification === filterClassification
      : true;
    return matchesSearch && matchesAccount && matchesClassification;
  });

  const handleOpenForm = (tx: Transaction | null = null) => {
    if (tx) {
      setEditingTx(tx);
      setFormData({
        description: tx.description,
        amount: String(tx.amount),
        type: tx.type,
        classification: tx.classification || 'personal',
        category_id: String(tx.category_id || ''),
        vehicle_id: (tx as any).vehicle_id ? String((tx as any).vehicle_id) : '',
        trip_id: (tx as any).trip_id ? String((tx as any).trip_id) : '',
        payment_account_id: tx.payment_account_id ? String(tx.payment_account_id) : '',
        transfer_account_id: tx.transfer_account_id ? String(tx.transfer_account_id) : '',
        transaction_date: new Date(tx.transaction_date).toISOString().split('T')[0],
      });
    } else {
      setEditingTx(null);
      const defaultAcc = paymentAccounts.find(a => a.is_default);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        classification: 'personal',
        category_id: '',
        vehicle_id: '',
        trip_id: '',
        payment_account_id: defaultAcc ? String(defaultAcc.id) : (paymentAccounts[0] ? String(paymentAccounts[0].id) : ''),
        transfer_account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
    }
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setView('list');
    setEditingTx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'transfer') {
      if (!formData.payment_account_id || !formData.transfer_account_id) {
        toast.error('Please select both From Account and To Account for transfer');
        return;
      }
      if (formData.payment_account_id === formData.transfer_account_id) {
        toast.error('From Account and To Account must be different');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        payment_account_id: formData.payment_account_id ? Number(formData.payment_account_id) : null,
        transfer_account_id: formData.type === 'transfer' && formData.transfer_account_id ? Number(formData.transfer_account_id) : null,
        category_id: formData.category_id || null,
        vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : null,
      };
      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}`, payload);
        toast.success('Transaction updated successfully');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction saved successfully');
      }
      await fetchTransactions();
      setView('list');
    } catch (error: any) {
      toast.error('Error saving transaction: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
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
      toast.success(`Category "${name}" added!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleQuickAddVehicle = async () => {
    const name = window.prompt('Enter new vehicle name (e.g. Acha Car, Liva Diesel):');
    if (!name || !name.trim()) return;

    const number = window.prompt('Enter vehicle registration number (optional, e.g. KL38L6781):') || '';

    try {
      const res = await api.post('/vehicles', {
        name: name.trim(),
        number: number.trim(),
        type: 'Car',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: 'Petrol',
        current_odometer: 0
      });

      toast.success(`Vehicle "${name.trim()}" added!`);
      const newVehId = res.data?.vehicleId;
      await fetchVehicles();
      if (newVehId) {
        setFormData(prev => ({ ...prev, vehicle_id: String(newVehId) }));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add vehicle.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch (error) {
      toast.error('Error deleting transaction');
    }
  };

  // Summary totals
  const totalIncome = filteredTransactions
    .reduce((sum, t) => {
      if (t.type === 'income') return sum + Number(t.amount);
      if (t.type === 'transfer' && filterAccount && String(t.transfer_account_id) === filterAccount) return sum + Number(t.amount);
      return sum;
    }, 0);

  const totalExpense = filteredTransactions
    .reduce((sum, t) => {
      if (t.type === 'expense') return sum + Number(t.amount);
      if (t.type === 'transfer' && filterAccount && String(t.payment_account_id) === filterAccount) return sum + Number(t.amount);
      return sum;
    }, 0);

  /* ==========================================
     RENDER FULL FORM PAGE
  ========================================== */
  if (view === 'form') {
    return (
      <div className="p-6 lg:p-10 bg-gray-50 min-h-screen animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Form Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCloseForm}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm flex items-center gap-2 font-medium text-sm"
              >
                <ArrowLeft size={18} /> Back to Transactions
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editingTx ? 'Edit Transaction' : 'Add New Transaction'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {editingTx ? 'Update transaction details below' : 'Record a new income or expense entry'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Transaction Type & Section Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag size={18} className="text-indigo-600" /> Transaction Type & Classification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type Selection Tabs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`py-3 px-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                        formData.type === 'expense'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowDownLeft size={16} /> Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`py-3 px-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                        formData.type === 'income'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowUpRight size={16} /> Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'transfer' })}
                      className={`py-3 px-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                        formData.type === 'transfer'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ArrowLeftRight size={16} /> Transfer
                    </button>
                  </div>
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, classification: 'personal' })}
                      className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        formData.classification === 'personal'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, classification: 'official' })}
                      className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        formData.classification === 'official'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Official
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Amount & Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-600" /> Amount & Category
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Amount Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Category Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category_id}
                      onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                      className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="">{formData.type === 'transfer' ? 'Account Transfer' : 'Select Category'}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      className="px-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center font-bold text-lg"
                      title="Quick Add Category"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Date Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                      required
                      className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Vehicle Field (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.vehicle_id}
                      onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="flex-1 py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="">Select Vehicle (Optional)</option>
                      {vehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.number ? `(${v.number})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleQuickAddVehicle}
                      className="px-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center font-bold text-lg"
                      title="Quick Add Vehicle"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Trip Field (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Trip (Optional)</label>
                  <select
                    value={formData.trip_id}
                    onChange={e => setFormData({ ...formData, trip_id: e.target.value })}
                    className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-gray-800"
                  >
                    <option value="">Select Trip (Optional)</option>
                    {trips.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        ✈️ {t.name} ({t.destination})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  placeholder={formData.type === 'transfer' ? 'e.g. Transfer to HDFC Savings to balance account' : 'What was this for? (e.g. Office Supplies, Salary, Coffee)'}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 3. Payment Account Selection Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Wallet size={18} className="text-indigo-600" /> {formData.type === 'transfer' ? 'Select Transfer Accounts' : 'Select Payment Account'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formData.type === 'transfer'
                      ? 'Select source account (From) and destination account (To)'
                      : 'Choose which cash, bank, UPI, or card account was used'}
                  </p>
                </div>
                <a
                  href="/voxdbook/payment-accounts"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Manage Accounts &rarr;
                </a>
              </div>

              {paymentAccounts.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No payment accounts found. You can create accounts under Payment Accounts menu.
                </div>
              ) : formData.type === 'transfer' ? (
                <div className="space-y-6">
                  {/* From Account */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-red-600 mb-2">
                      From Account (Money Debited Out) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paymentAccounts.map(acc => {
                        const isSelected = formData.payment_account_id === String(acc.id);
                        const isOtherSelected = formData.transfer_account_id === String(acc.id);
                        const colorClass = isSelected
                          ? ACCOUNT_SELECTED_COLORS[acc.account_type]
                          : ACCOUNT_COLORS[acc.account_type];

                        return (
                          <button
                            key={acc.id}
                            type="button"
                            disabled={isOtherSelected}
                            onClick={() => setFormData({ ...formData, payment_account_id: String(acc.id) })}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all relative ${colorClass} ${
                              isOtherSelected ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-white/80 shadow-sm flex-shrink-0">
                                {ACCOUNT_ICONS[acc.account_type]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{acc.account_name}</p>
                                <p className="text-[11px] font-semibold opacity-90 truncate">
                                  Bal: ₹{Number(acc.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm">
                                <Check size={14} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* To Account */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-green-600 mb-2">
                      To Account (Money Credited In) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paymentAccounts.map(acc => {
                        const isSelected = formData.transfer_account_id === String(acc.id);
                        const isOtherSelected = formData.payment_account_id === String(acc.id);
                        const colorClass = isSelected
                          ? ACCOUNT_SELECTED_COLORS[acc.account_type]
                          : ACCOUNT_COLORS[acc.account_type];

                        return (
                          <button
                            key={acc.id}
                            type="button"
                            disabled={isOtherSelected}
                            onClick={() => setFormData({ ...formData, transfer_account_id: String(acc.id) })}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all relative ${colorClass} ${
                              isOtherSelected ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-white/80 shadow-sm flex-shrink-0">
                                {ACCOUNT_ICONS[acc.account_type]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{acc.account_name}</p>
                                <p className="text-[11px] font-semibold opacity-90 truncate">
                                  Bal: ₹{Number(acc.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shadow-sm">
                                <Check size={14} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paymentAccounts.map(acc => {
                    const isSelected = formData.payment_account_id === String(acc.id);
                    const colorClass = isSelected
                      ? ACCOUNT_SELECTED_COLORS[acc.account_type]
                      : ACCOUNT_COLORS[acc.account_type];

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_account_id: String(acc.id) })}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all relative ${colorClass}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-white/80 shadow-sm flex-shrink-0">
                            {ACCOUNT_ICONS[acc.account_type]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{acc.account_name}</p>
                            <p className="text-[11px] font-semibold opacity-90 truncate">
                              Bal: ₹{Number(acc.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {acc.is_default && !isSelected && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                              default
                            </span>
                          )}
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} /> {editingTx ? 'Update Transaction' : 'Save Transaction'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER LIST VIEW
  ========================================== */
  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">Manage your income and expenses</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 text-sm"
          onClick={() => handleOpenForm()}
        >
          <Plus size={18} /> Add Transaction
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-red-500">₹{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Net Balance</p>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
            ₹{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterClassification}
          onChange={e => setFilterClassification(e.target.value)}
        >
          <option value="">All Classifications (Personal & Official)</option>
          <option value="personal">Personal</option>
          <option value="official">Official</option>
        </select>
        <select
          className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterAccount}
          onChange={e => setFilterAccount(e.target.value)}
        >
          <option value="">All Accounts</option>
          {paymentAccounts.map(a => (
            <option key={a.id} value={String(a.id)}>{a.account_name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-red-600 uppercase tracking-wider text-right">Expense (₹)</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-green-600 uppercase tracking-wider text-right">Income (₹)</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading transactions...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No transactions found.</td></tr>
              ) : filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{tx.description}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                      <Tag size={11} /> {tx.category_name || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {tx.type === 'transfer' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        <span>{tx.account_name || 'Account'}</span>
                        <ArrowLeftRight size={12} className="text-amber-600 flex-shrink-0" />
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
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${tx.classification === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {tx.classification === 'personal' ? 'Personal' : 'Official'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold whitespace-nowrap">
                    {tx.type === 'expense' ? (
                      <span className="text-red-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : tx.type === 'transfer' && filterAccount === String(tx.payment_account_id) ? (
                      <span className="text-amber-700 font-bold" title="Transfer Out">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-bold whitespace-nowrap">
                    {tx.type === 'income' ? (
                      <span className="text-green-600">₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : tx.type === 'transfer' && filterAccount === String(tx.transfer_account_id) ? (
                      <span className="text-amber-700 font-bold" title="Transfer In">⇄ ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : tx.type === 'transfer' && !filterAccount ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                        <ArrowLeftRight size={11} /> ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                        onClick={() => handleOpenForm(tx)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
