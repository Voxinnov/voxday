import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  Stethoscope,
  Tag
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface HospitalRecord {
  id: number;
  transaction_id?: number | null;
  patient_name: string;
  hospital_name: string;
  visit_date: string;
  expense_type: string;
  notes?: string;
  amount: number | string;
  payment_account_id?: number | null;
  account_name?: string;
  category_name?: string;
}

interface PaymentAccount {
  id: number;
  account_name: string;
}

const EXPENSE_TYPES = [
  'Consultation',
  'Hospital',
  'Medicine',
  'Lab Test',
  'Scan',
  'Surgery',
  'Treatment',
  'Other'
];

const HospitalExpenses: React.FC = () => {
  const [records, setRecords] = useState<HospitalRecord[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [patients, setPatients] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HospitalRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    patient_name: '',
    hospital_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    expense_type: 'Consultation',
    amount: '',
    payment_account_id: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospital');
      setRecords(res.data.data || []);
      setPatients(res.data.patients || []);
      setHospitals(res.data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospital records:', error);
      toast.error('Failed to load hospital expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/payment-accounts');
      setPaymentAccounts(res.data || []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
    }
  };

  const resetForm = () => {
    setForm({
      patient_name: '',
      hospital_name: '',
      visit_date: new Date().toISOString().split('T')[0],
      expense_type: 'Consultation',
      amount: '',
      payment_account_id: paymentAccounts.length > 0 ? String(paymentAccounts[0].id) : '',
      notes: ''
    });
    setEditingRecord(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    if (selectedPatient !== 'all') {
      setForm((prev) => ({ ...prev, patient_name: selectedPatient }));
    }
    if (selectedHospital !== 'all') {
      setForm((prev) => ({ ...prev, hospital_name: selectedHospital }));
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: HospitalRecord) => {
    setEditingRecord(rec);
    setForm({
      patient_name: rec.patient_name,
      hospital_name: rec.hospital_name,
      visit_date: new Date(rec.visit_date).toISOString().split('T')[0],
      expense_type: rec.expense_type,
      amount: String(rec.amount || ''),
      payment_account_id: rec.payment_account_id ? String(rec.payment_account_id) : '',
      notes: rec.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.hospital_name || !form.visit_date || !form.expense_type || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/hospital/${editingRecord.id}`, form);
        toast.success('Hospital expense updated');
      } else {
        await api.post('/hospital', form);
        toast.success('Hospital expense added');
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving hospital record:', error);
      toast.error(error.response?.data?.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId: number, patientName: string) => {
    if (!window.confirm(`Are you sure you want to delete this hospital expense for ${patientName}?`)) {
      return;
    }

    try {
      await api.delete(`/hospital/${recordId}`);
      toast.success('Hospital record deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting hospital record:', error);
      toast.error('Failed to delete hospital record');
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Patient Filter
      if (selectedPatient !== 'all' && r.patient_name.toLowerCase() !== selectedPatient.toLowerCase()) {
        return false;
      }

      // Hospital Filter
      if (selectedHospital !== 'all' && r.hospital_name.toLowerCase() !== selectedHospital.toLowerCase()) {
        return false;
      }

      // Expense Type Filter
      if (selectedType !== 'all' && r.expense_type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Search Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const mPatient = r.patient_name.toLowerCase().includes(term);
        const mHospital = r.hospital_name.toLowerCase().includes(term);
        const mNotes = (r.notes || '').toLowerCase().includes(term);
        const mType = r.expense_type.toLowerCase().includes(term);
        if (!mPatient && !mHospital && !mNotes && !mType) return false;
      }

      // Date Range Filter
      if (dateRange !== 'all') {
        const rDate = new Date(r.visit_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateRange === 'today') {
          const itemDate = new Date(r.visit_date);
          itemDate.setHours(0, 0, 0, 0);
          if (itemDate.getTime() !== today.getTime()) return false;
        } else if (dateRange === 'this_week') {
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
          if (rDate < firstDayOfWeek) return false;
        } else if (dateRange === 'this_month') {
          if (rDate.getMonth() !== today.getMonth() || rDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        } else if (dateRange === 'custom') {
          if (startDate && new Date(r.visit_date) < new Date(startDate)) return false;
          if (endDate && new Date(r.visit_date) > new Date(endDate)) return false;
        }
      }

      return true;
    });
  }, [records, selectedPatient, selectedHospital, selectedType, searchTerm, dateRange, startDate, endDate]);

  // Dynamic Summary Metrics based on dataset
  const summaryMetrics = useMemo(() => {
    const totalCost = filteredRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const today = new Date();
    const thisMonthCost = records
      .filter((r) => {
        const d = new Date(r.visit_date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      })
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const uniquePatients = new Set(filteredRecords.map((r) => r.patient_name.trim())).size;

    return {
      totalCost,
      thisMonthCost,
      visitCount: filteredRecords.length,
      patientCount: uniquePatients
    };
  }, [filteredRecords, records]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
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
            <Stethoscope className="w-7 h-7 text-indigo-600" />
            <span>Hospital Expenses</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track patient medical visits, consultations, scans, medicines, and hospital expenses easily.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hospital Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Expense
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 block">
            ₹{summaryMetrics.totalCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            This Month
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-blue-600 block">
            ₹{summaryMetrics.thisMonthCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Visits
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 block">
            {summaryMetrics.visitCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Patients
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 block">
            {summaryMetrics.patientCount}
          </span>
        </div>
      </div>

      {/* Individual Patient Filter Summary Banner */}
      {selectedPatient !== 'all' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Patient: <span className="text-indigo-700">{selectedPatient}</span>
              </h3>
              <p className="text-xs text-gray-600">
                Showing all medical visits and hospital expenses for {selectedPatient}.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedPatient('all')}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
          >
            Show All Patients
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient, hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Patient Filter */}
          <div>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">👤 All Patients</option>
              {patients.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">🏥 All Hospitals</option>
              {hospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Expense Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">🏷️ All Expense Types</option>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">📅 All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Responsive Desktop Table / Mobile Cards */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No hospital expenses found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Add your first hospital expense to start tracking patient visits, consultations, and medical bills.
          </p>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hospital Expense</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (sm and up) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Hospital / Clinic</th>
                    <th className="py-3 px-4">Visit Date</th>
                    <th className="py-3 px-4">Expense Type</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Expense</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <button
                          onClick={() => setSelectedPatient(rec.patient_name)}
                          className="hover:text-indigo-600 hover:underline text-left"
                        >
                          {rec.patient_name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <button
                          onClick={() => setSelectedHospital(rec.hospital_name)}
                          className="hover:text-indigo-600 hover:underline text-left"
                        >
                          {rec.hospital_name}
                        </button>
                        {rec.notes && <p className="text-xs text-gray-400 font-normal mt-0.5">{rec.notes}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {formatDate(rec.visit_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          <span>{rec.expense_type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {rec.account_name || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap text-base">
                        ₹{Number(rec.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id, rec.patient_name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (below sm) */}
          <div className="block sm:hidden space-y-3">
            {filteredRecords.map((rec) => (
              <div key={rec.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{rec.patient_name}</h4>
                    <p className="text-xs font-semibold text-indigo-600">{rec.hospital_name}</p>
                  </div>
                  <span className="text-base font-extrabold text-rose-600">
                    ₹{Number(rec.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-b border-gray-100 py-2">
                  <span>📅 {formatDate(rec.visit_date)}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {rec.expense_type}
                  </span>
                </div>

                {rec.notes && <p className="text-xs text-gray-500">{rec.notes}</p>}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEditModal(rec)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id, rec.patient_name)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Hospital Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRecord ? 'Edit Hospital Expense' : 'Add Hospital Expense'}
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
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vishnu"
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Hospital / Clinic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aster Medcity"
                  value={form.hospital_name}
                  onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.visit_date}
                    onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Expense Type *
                  </label>
                  <select
                    value={form.expense_type}
                    onChange={(e) => setForm({ ...form, expense_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Expense (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="2500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payment Account
                  </label>
                  <select
                    value={form.payment_account_id}
                    onChange={(e) => setForm({ ...form, payment_account_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  >
                    <option value="">Select Account</option>
                    {paymentAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                  {saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalExpenses;
