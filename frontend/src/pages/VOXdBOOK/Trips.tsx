import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Calendar, Plus, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface Trip {
  id: number;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number | string;
  spent?: number | string;
  plan_count?: number;
  place_count?: number;
}

const Trips: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    destination: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      destination: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: ''
    });
    setEditingTrip(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setForm({
      name: trip.name,
      destination: trip.destination,
      start_date: new Date(trip.start_date).toISOString().split('T')[0],
      end_date: new Date(trip.end_date).toISOString().split('T')[0],
      budget: String(trip.budget || '')
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.destination || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, form);
        toast.success('Trip updated successfully');
      } else {
        await api.post('/trips', form);
        toast.success('Trip created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchTrips();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast.error(error.response?.data?.message || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async (tripId: number, tripName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete "${tripName}"? This will delete the trip plans and places, but keep your financial transaction records safe.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/trips/${tripId}`);
      toast.success(`Trip "${tripName}" deleted`);
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  // Helper to calculate trip status dynamically based on dates
  const getTripStatus = (startStr: string, endStr: string) => {
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

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('en-IN', options)} – ${end.toLocaleDateString('en-IN', options)}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plane className="w-7 h-7 text-indigo-600" />
            <span>Trips</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan and manage your upcoming, ongoing, and completed trips effortlessly.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Trip</span>
        </button>
      </div>

      {/* Trips Grid / List */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <Plane className="w-16 h-16 text-gray-300 mx-auto" />
          <h3 className="text-xl font-bold text-gray-800">No trips planned yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Create your first trip and start organizing your itinerary, places to visit, and expenses.
          </p>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Trip</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const status = getTripStatus(trip.start_date, trip.end_date);
            const spentNum = Number(trip.spent || 0);
            const budgetNum = Number(trip.budget || 0);

            return (
              <div
                key={trip.id}
                onClick={() => navigate(`/voxdbook/trips/${trip.id}`)}
                className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Card Top */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {trip.name}
                      </h3>
                      <p className="text-sm font-semibold text-gray-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span>{trip.destination}</span>
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                  </div>

                  {/* Financial & Counts Info */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Budget</span>
                      <span className="font-extrabold text-gray-900">
                        ₹{budgetNum.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Spent</span>
                      <span className="font-extrabold text-rose-600">
                        ₹{spentNum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/voxdbook/trips/${trip.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <span>Open Trip</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(trip, e)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Trip"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, trip.name, e)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTrip ? 'Edit Trip' : 'New Trip'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Trip Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Trip"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Budget (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="30000"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
