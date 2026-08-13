import React, { useState, useEffect, useMemo } from 'react';
import {
  Fuel as FuelIcon,
  Car,
  Calendar,
  Search,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'bank_transfer';

interface Vehicle {
  id: number;
  name: string;
  number: string;
  type: string;
  brand: string;
  model: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  classification: 'personal' | 'official';
  category_id?: string | number;
  category_name?: string;
  vehicle_id?: number | null;
  vehicle_name?: string;
  vehicle_number?: string;
  payment_account_id?: number | null;
  account_name?: string;
  account_type?: AccountType;
  transaction_date: string;
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Wallet size={12} />,
  bank: <Landmark size={12} />,
  upi: <Smartphone size={12} />,
  credit_card: <CreditCard size={12} />,
  bank_transfer: <ArrowLeftRight size={12} />,
};

const FuelManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, vehRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/vehicles')
      ]);

      setTransactions(txRes.data || []);
      setVehicles(vehRes.data?.data || vehRes.data || []);
    } catch (error) {
      console.error('Error fetching fuel management data:', error);
      toast.error('Failed to load fuel expense data');
    } finally {
      setLoading(false);
    }
  };

  // Filter ONLY Fuel Expense transactions
  const fuelTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const catName = (t.category_name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      // Match Fuel Expense category or fuel keywords
      return (
        catName === 'fuel expense' ||
        catName.includes('fuel') ||
        desc.includes('fuel expense')
      );
    });
  }, [transactions]);

  // Helper to match transaction with vehicle
  const getVehicleForTx = (tx: Transaction): Vehicle | null => {
    if (tx.vehicle_id) {
      const match = vehicles.find((v) => v.id === Number(tx.vehicle_id));
      if (match) return match;
    }
    if (tx.vehicle_name) {
      const match = vehicles.find(
        (v) => v.name.toLowerCase() === tx.vehicle_name?.toLowerCase()
      );
      if (match) return match;
    }
    // Fallback search in description (e.g. "Acha Car", "Liva Diesel", "Glanza")
    if (tx.description) {
      const descLower = tx.description.toLowerCase();
      const match = vehicles.find(
        (v) =>
          descLower.includes(v.name.toLowerCase()) ||
          descLower.includes(v.number.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  // Apply filters (Vehicle, Date, Search)
  const filteredFuelTransactions = useMemo(() => {
    return fuelTransactions.filter((tx) => {
      // Vehicle Filter
      if (selectedVehicle !== 'all') {
        const vehicle = getVehicleForTx(tx);
        const selectedId = Number(selectedVehicle);
        if (!vehicle || vehicle.id !== selectedId) {
          return false;
        }
      }

      // Search Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const vehicle = getVehicleForTx(tx);
        const matchesDesc = (tx.description || '').toLowerCase().includes(term);
        const matchesAccount = (tx.account_name || '').toLowerCase().includes(term);
        const matchesVehicle = vehicle ? vehicle.name.toLowerCase().includes(term) : false;
        if (!matchesDesc && !matchesAccount && !matchesVehicle) {
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
  }, [fuelTransactions, selectedVehicle, searchTerm, dateRange, startDate, endDate, vehicles]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCost = filteredFuelTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const today = new Date();
    const thisMonthCost = fuelTransactions
      .filter((t) => {
        const d = new Date(t.transaction_date);
        return (
          d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Vehicle breakdown
    const vehicleTotals: Record<string, number> = {};
    fuelTransactions.forEach((tx) => {
      const v = getVehicleForTx(tx);
      const name = v ? v.name : 'Other / Unassigned';
      vehicleTotals[name] = (vehicleTotals[name] || 0) + Number(tx.amount || 0);
    });

    return {
      totalCost,
      thisMonthCost,
      entryCount: filteredFuelTransactions.length,
      vehicleTotals
    };
  }, [filteredFuelTransactions, fuelTransactions, vehicles]);

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
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <Link to="/voxdbook/vehicle-management" className="hover:text-primary-600 flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              <span>Vehicle Management</span>
            </Link>
            <span>/</span>
            <span className="text-primary-600">Fuel</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FuelIcon className="w-7 h-7 text-primary-600" />
            <span>Fuel Management</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and monitor all vehicle fuel expenses automatically synced from your transactions.
          </p>
        </div>

        <Link
          to="/voxdbook/transactions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Fuel Expense</span>
            <FuelIcon className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            ₹{summaryMetrics.totalCost.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-gray-500">
            {selectedVehicle !== 'all' ? 'For selected vehicle & filters' : 'Across all vehicles'}
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
            <span>Fuel Entries</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            {summaryMetrics.entryCount}
          </div>
          <p className="text-xs text-gray-500">Total transaction entries</p>
        </div>
      </div>

      {/* Vehicle-wise breakdown chips */}
      {Object.keys(summaryMetrics.vehicleTotals).length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Vehicle Spend Breakdown
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(summaryMetrics.vehicleTotals).map(([vName, vCost]) => (
              <div
                key={vName}
                className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-gray-700"
              >
                <Car className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-bold text-gray-900">{vName}:</span>
                <span className="text-primary-700 font-extrabold">
                  ₹{Number(vCost).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Vehicle Dropdown Filter */}
          <div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
            >
              <option value="all">🚗 All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.number})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
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
                setSelectedVehicle('all');
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
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Fuel Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredFuelTransactions.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <FuelIcon className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">No fuel expenses found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Add a transaction with the <span className="font-semibold text-gray-700">"Fuel Expense"</span> category to see it here automatically.
            </p>
            <div className="pt-2">
              <Link
                to="/voxdbook/transactions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fuel Transaction</span>
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
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredFuelTransactions.map((tx) => {
                  const vehicle = getVehicleForTx(tx);
                  const accType = tx.account_type || 'cash';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4">
                        {vehicle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Car className="w-3.5 h-3.5 text-blue-600" />
                            <span>{vehicle.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {tx.description || 'Fuel Expense'}
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
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            tx.classification === 'official'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {tx.classification || 'official'}
                        </span>
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

export default FuelManagement;
