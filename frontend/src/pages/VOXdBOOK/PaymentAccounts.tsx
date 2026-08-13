import React, { useState, useEffect } from 'react';
import {
  Plus, Wallet, Landmark, Smartphone, CreditCard, ArrowLeftRight,
  Pencil, Trash2, Star, StarOff, X, Check
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'bank_transfer';

interface PaymentAccount {
  id: number;
  account_name: string;
  account_type: AccountType;
  bank_name?: string;
  account_number?: string;
  upi_id?: string;
  initial_balance?: number | string;
  current_balance?: number | string;
  is_default: number;
  created_at: string;
}

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  cash: {
    label: 'Cash',
    icon: <Wallet size={22} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  bank: {
    label: 'Bank Account',
    icon: <Landmark size={22} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  upi: {
    label: 'UPI',
    icon: <Smartphone size={22} />,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
  },
  credit_card: {
    label: 'Credit Card',
    icon: <CreditCard size={22} />,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: <ArrowLeftRight size={22} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
};

const emptyForm = {
  account_name: '',
  account_type: 'cash' as AccountType,
  bank_name: '',
  account_number: '',
  upi_id: '',
  initial_balance: '0',
  is_default: false,
};

const PaymentAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/payment-accounts');
      setAccounts(res.data);
    } catch {
      toast.error('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (account?: PaymentAccount) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        account_name: account.account_name,
        account_type: account.account_type,
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        upi_id: account.upi_id || '',
        initial_balance: String(account.initial_balance ?? 0),
        is_default: !!account.is_default,
      });
    } else {
      setEditingId(null);
      setFormData({ ...emptyForm });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        initial_balance: parseFloat(formData.initial_balance) || 0
      };
      if (editingId) {
        await api.put(`/payment-accounts/${editingId}`, payload);
        toast.success('Account updated');
      } else {
        await api.post('/payment-accounts', payload);
        toast.success('Account added');
      }
      await fetchAccounts();
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this payment account?')) return;
    try {
      await api.delete(`/payment-accounts/${id}`);
      toast.success('Account deleted');
      fetchAccounts();
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/payment-accounts/${id}/set-default`, {});
      toast.success('Default account updated');
      fetchAccounts();
    } catch {
      toast.error('Failed to update default');
    }
  };

  const type = formData.account_type;

  const totalCashBalance = accounts
    .filter(a => a.account_type === 'cash')
    .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

  const totalAllBalance = accounts
    .reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Accounts & Cash Balance</h1>
          <p className="text-gray-500 text-sm">Manage your cash, bank, UPI & card account tallies</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm"
        >
          <Plus size={18} /> Add Account
        </button>
      </header>

      {/* Balance Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Cash Balance</p>
            <h2 className="text-3xl font-extrabold mt-1">₹{totalCashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">Physical Cash in hand across all cash accounts</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Wallet size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Accounts Balance</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">₹{totalAllBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Overall balance tally across Cash, Bank, UPI & Cards</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Landmark size={28} />
          </div>
        </div>
      </div>

      {/* Account Type Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {(Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map(t => {
          const meta = ACCOUNT_TYPE_META[t];
          const typeAccounts = accounts.filter(a => a.account_type === t);
          const count = typeAccounts.length;
          const typeBalance = typeAccounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

          return (
            <div key={t} className={`rounded-xl border p-4 flex flex-col items-center gap-1 ${meta.bg}`}>
              <span className={meta.color}>{meta.icon}</span>
              <span className="text-xs font-semibold text-gray-700 text-center">{meta.label}</span>
              <span className={`text-lg font-extrabold ${meta.color}`}>
                ₹{typeBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{count} {count === 1 ? 'account' : 'accounts'}</span>
            </div>
          );
        })}
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <Wallet size={48} className="opacity-30" />
          <p className="text-lg font-medium">No payment accounts yet</p>
          <p className="text-sm">Click "Add Account" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(account => {
            const meta = ACCOUNT_TYPE_META[account.account_type];
            const currBalance = Number(account.current_balance || 0);

            return (
              <div
                key={account.id}
                className={`relative bg-white rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-all ${account.is_default ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-100'}`}
              >
                {/* Default badge */}
                {account.is_default ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                ) : null}

                {/* Icon + Type */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${meta.bg} mb-3`}>
                  <span className={meta.color}>{meta.icon}</span>
                  <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                </div>

                {/* Account Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{account.account_name}</h3>

                {/* Balance Card Tally */}
                <div className={`my-3 p-3.5 rounded-xl border ${
                  account.account_type === 'cash' ? 'bg-emerald-50/90 border-emerald-200' :
                  account.account_type === 'bank' ? 'bg-blue-50/90 border-blue-200' :
                  account.account_type === 'credit_card' ? 'bg-rose-50/90 border-rose-200' :
                  account.account_type === 'upi' ? 'bg-violet-50/90 border-violet-200' :
                  'bg-amber-50/90 border-amber-200'
                }`}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                    <span>
                      {account.account_type === 'cash' ? '💵 Cash Balance' :
                       account.account_type === 'bank' ? '🏦 Current Bank Balance' :
                       account.account_type === 'credit_card' ? '💳 Outstanding Balance' :
                       account.account_type === 'upi' ? '📱 UPI Balance' : 'Current Balance'}
                    </span>
                  </p>
                  <p className={`text-2xl font-black mt-1 ${
                    currBalance < 0 ? 'text-red-600' :
                    account.account_type === 'cash' ? 'text-emerald-700' :
                    account.account_type === 'bank' ? 'text-blue-700' :
                    account.account_type === 'credit_card' ? 'text-rose-700' :
                    account.account_type === 'upi' ? 'text-violet-700' :
                    'text-amber-700'
                  }`}>
                    ₹{currBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  {Number(account.initial_balance || 0) > 0 && (
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      Opening Balance: ₹{Number(account.initial_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-0.5 text-sm text-gray-500 mb-4">
                  {account.bank_name && <p>🏦 {account.bank_name}</p>}
                  {account.account_number && <p>💳 ••••{account.account_number}</p>}
                  {account.upi_id && <p>📱 {account.upi_id}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      title="Set as default"
                    >
                      <StarOff size={14} /> Set Default
                    </button>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => openModal(account)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Account' : 'Add Payment Account'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(ACCOUNT_TYPE_META) as AccountType[]).map(t => {
                    const m = ACCOUNT_TYPE_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, account_type: t }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-semibold transition-all ${formData.account_type === t ? `${m.bg} border-current ${m.color}` : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                      >
                        <span className={formData.account_type === t ? m.color : ''}>{m.icon}</span>
                        <span className="leading-tight text-center">{m.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder={type === 'cash' ? 'e.g. Petty Cash / Main Cash' : type === 'upi' ? 'e.g. GPay' : type === 'credit_card' ? 'e.g. HDFC Credit Card' : 'e.g. SBI Savings'}
                  value={formData.account_name}
                  onChange={e => setFormData(f => ({ ...f, account_name: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Initial / Opening Balance */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Initial / Opening Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.initial_balance}
                    onChange={e => setFormData(f => ({ ...f, initial_balance: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Starting cash balance when account was created</p>
              </div>

              {/* Bank Name — for bank, credit_card, bank_transfer */}
              {(type === 'bank' || type === 'credit_card' || type === 'bank_transfer') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC, SBI, ICICI"
                    value={formData.bank_name}
                    onChange={e => setFormData(f => ({ ...f, bank_name: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Account Number — for bank, credit_card */}
              {(type === 'bank' || type === 'credit_card') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {type === 'credit_card' ? 'Last 4 digits of Card' : 'Account Number (last 4 digits)'}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4321"
                    value={formData.account_number}
                    onChange={e => setFormData(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* UPI ID — for upi */}
              {type === 'upi' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. name@upi or 9876543210@paytm"
                    value={formData.upi_id}
                    onChange={e => setFormData(f => ({ ...f, upi_id: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Set as Default */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setFormData(f => ({ ...f, is_default: !f.is_default }))}
                  className={`w-10 h-6 rounded-full flex items-center transition-colors ${formData.is_default ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${formData.is_default ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Set as default account</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Check size={16} /> {editingId ? 'Update' : 'Save Account'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAccounts;
