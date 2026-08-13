import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Tag
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface Trip {
  id: number;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | string;
  spent: number;
  remaining: number;
}

interface PlanItem {
  id: number;
  trip_id: number;
  date: string;
  time?: string;
  title: string;
  notes?: string;
}

interface PlaceItem {
  id: number;
  trip_id: number;
  name: string;
  notes?: string;
}

interface TransactionItem {
  id: number;
  description: string;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  category_name?: string;
  account_name?: string;
  transaction_date: string;
}

interface Category {
  id: number;
  name: string;
}

interface PaymentAccount {
  id: number;
  account_name: string;
}

const TripDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [expenses, setExpenses] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'plan' | 'places' | 'expenses'>('plan');

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

  // Categories & Payment accounts for expense creation
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);

  // Forms
  const [planForm, setPlanForm] = useState({
    date: '',
    time: '09:00',
    title: '',
    notes: ''
  });

  const [placeForm, setPlaceForm] = useState({
    name: '',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category_id: '',
    payment_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [tripForm, setTripForm] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: ''
  });

  useEffect(() => {
    if (id) {
      fetchTripDetails();
      fetchAuxData();
    }
  }, [id]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/${id}`);
      const data = res.data.data;
      setTrip(data.trip);
      setPlans(data.plans || []);
      setPlaces(data.places || []);
      setExpenses(data.expenses || []);

      // Default plan date to trip start date
      if (data.trip?.start_date) {
        setPlanForm((prev) => ({
          ...prev,
          date: new Date(data.trip.start_date).toISOString().split('T')[0]
        }));
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [catRes, accRes] = await Promise.all([
        api.get('/categories'),
        api.get('/payment-accounts')
      ]);
      setCategories(catRes.data || []);
      setAccounts(accRes.data || []);
    } catch (error) {
      console.error('Error fetching aux data:', error);
    }
  };

  // Status computation
  const getTripStatus = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return { label: 'Scheduled', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);

    if (today < start) {
      return { label: '🟢 Upcoming', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    } else if (today >= start && today <= end) {
      return { label: '🟠 Ongoing', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      return { label: '⚪ Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const calculateDays = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return 0;
    const diff = new Date(endStr).getTime() - new Date(startStr).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1);
  };

  // Add Plan
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.title || !planForm.date) {
      toast.error('Please enter plan title and date');
      return;
    }
    try {
      await api.post(`/trips/${id}/plans`, planForm);
      toast.success('Plan added');
      setIsPlanModalOpen(false);
      setPlanForm({ date: trip?.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '', time: '09:00', title: '', notes: '' });
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to add plan');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: number) => {
    try {
      await api.delete(`/trips/plans/${planId}`);
      toast.success('Plan removed');
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to remove plan');
    }
  };

  // Add Place
  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeForm.name) {
      toast.error('Please enter place name');
      return;
    }
    try {
      await api.post(`/trips/${id}/places`, placeForm);
      toast.success('Place added');
      setIsPlaceModalOpen(false);
      setPlaceForm({ name: '', notes: '' });
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to add place');
    }
  };

  // Delete Place
  const handleDeletePlace = async (placeId: number) => {
    try {
      await api.delete(`/trips/places/${placeId}`);
      toast.success('Place removed');
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to remove place');
    }
  };

  // Add Expense inside trip (Pre-filled with trip_id)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.transaction_date) {
      toast.error('Please provide description, amount, and date');
      return;
    }

    try {
      await api.post('/transactions', {
        ...expenseForm,
        trip_id: Number(id),
        type: 'expense',
        classification: 'personal'
      });
      toast.success('Expense recorded for trip!');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        description: '',
        amount: '',
        category_id: '',
        payment_account_id: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  // Edit Trip
  const handleOpenEditTrip = () => {
    if (!trip) return;
    setTripForm({
      name: trip.name,
      destination: trip.destination,
      start_date: new Date(trip.start_date).toISOString().split('T')[0],
      end_date: new Date(trip.end_date).toISOString().split('T')[0],
      budget: String(trip.budget || '')
    });
    setIsEditTripOpen(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/trips/${id}`, tripForm);
      toast.success('Trip updated');
      setIsEditTripOpen(false);
      fetchTripDetails();
    } catch (error) {
      toast.error('Failed to update trip');
    }
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    if (!trip) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${trip.name}"? Financial transactions will be kept safe in your Transaction List.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/trips/${id}`);
      toast.success(`Trip "${trip.name}" deleted`);
      navigate('/voxdbook/trips');
    } catch (error) {
      toast.error('Failed to delete trip');
    }
  };

  // Group plans by Date
  const groupedPlans = plans.reduce((acc: Record<string, PlanItem[]>, plan) => {
    const dStr = new Date(plan.date).toISOString().split('T')[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(plan);
    return acc;
  }, {});

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading || !trip) {
    return (
      <div className="p-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const status = getTripStatus(trip.start_date, trip.end_date);
  const tripDays = calculateDays(trip.start_date, trip.end_date);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/voxdbook/trips"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Trips</span>
        </Link>
      </div>

      {/* Trip Header Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                ✈️ {trip.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-600 flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>{trip.destination}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {new Date(trip.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –{' '}
                  {new Date(trip.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditTrip}
              className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDeleteTrip}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Budget Metric Badges */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Budget</span>
            <span className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-1 block">
              ₹{Number(trip.budget || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">Spent</span>
            <span className="text-lg sm:text-2xl font-extrabold text-rose-600 mt-1 block">
              ₹{Number(trip.spent || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Remaining</span>
            <span className="text-lg sm:text-2xl font-extrabold text-emerald-700 mt-1 block">
              ₹{Number(trip.remaining || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Sub-counts */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold pt-1">
          <span>📅 {tripDays} Days</span>
          <span>📍 {places.length} Places</span>
          <span>📝 {plans.length} Plans</span>
          <span>💰 {expenses.length} Expenses</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'plan'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Plan ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('places')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'places'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Places ({places.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Expenses ({expenses.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. PLAN TAB */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Itinerary & Activities</h2>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan</span>
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">No activities added to plan yet.</p>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + Add first activity
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedPlans)
                .sort()
                .map((dateKey) => (
                  <div key={dateKey} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider border-b border-gray-100 pb-2">
                      📅 {formatDate(dateKey)}
                    </h3>

                    <div className="space-y-3 divide-y divide-gray-50">
                      {groupedPlans[dateKey].map((plan) => (
                        <div key={plan.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 group">
                          <div className="flex items-start gap-3">
                            {plan.time && (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {plan.time}
                              </span>
                            )}
                            <div>
                              <h4 className="text-sm font-bold text-gray-900">{plan.title}</h4>
                              {plan.notes && <p className="text-xs text-gray-500 mt-0.5">{plan.notes}</p>}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-all"
                            title="Delete plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PLACES TAB */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Places to Visit</h2>
            <button
              onClick={() => setIsPlaceModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Place</span>
            </button>
          </div>

          {places.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">No places added yet.</p>
              <button
                onClick={() => setIsPlaceModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + Add a place to visit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{place.name}</h4>
                      {place.notes && <p className="text-xs text-gray-500 mt-1">{place.notes}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePlace(place.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-all"
                    title="Delete place"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Trip Expenses</h2>
              <p className="text-xs text-gray-500">Synced live with your main Transaction List</p>
            </div>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-600">No expenses recorded for this trip yet.</p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                + Add first trip expense
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">{tx.description}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Tag className="w-3 h-3 text-indigo-500" />
                            <span>{tx.category_name || 'Expense'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-gray-600">
                          {tx.account_name || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}

      {/* Add Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsPlanModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add Plan Activity</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 font-bold">×</button>
            </div>
            <form onSubmit={handleAddPlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={planForm.date}
                    onChange={(e) => setPlanForm({ ...planForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time</label>
                  <input
                    type="time"
                    value={planForm.time}
                    onChange={(e) => setPlanForm({ ...planForm, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visit Baga Beach"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={planForm.notes}
                  onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Place Modal */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsPlaceModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add Place</h3>
              <button onClick={() => setIsPlaceModalOpen(false)} className="text-gray-400 font-bold">×</button>
            </div>
            <form onSubmit={handleAddPlace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Place Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fort Aguada"
                  value={placeForm.name}
                  onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sunset view point"
                  value={placeForm.notes}
                  onChange={(e) => setPlaceForm({ ...placeForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsPlaceModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Save Place</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add Trip Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 font-bold">×</button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Hotel"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="6000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.transaction_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  value={expenseForm.category_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment Account</label>
                <select
                  value={expenseForm.payment_account_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment_account_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                >
                  <option value="">Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {isEditTripOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsEditTripOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Edit Trip Details</h3>
              <button onClick={() => setIsEditTripOpen(false)} className="text-gray-400 font-bold">×</button>
            </div>
            <form onSubmit={handleUpdateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Trip Name *</label>
                <input
                  type="text"
                  required
                  value={tripForm.name}
                  onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Destination *</label>
                <input
                  type="text"
                  required
                  value={tripForm.destination}
                  onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={tripForm.start_date}
                    onChange={(e) => setTripForm({ ...tripForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={tripForm.end_date}
                    onChange={(e) => setTripForm({ ...tripForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tripForm.budget}
                  onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditTripOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
