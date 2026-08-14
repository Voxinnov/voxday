import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Stethoscope,
  ShieldCheck,
  Eye,
  X,
  AlertCircle,
  Clock,
  Download,
  Paperclip,
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  Receipt
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'bank_transfer';

interface PaymentAccount {
  id: number;
  account_name: string;
  account_type: AccountType;
  bank_name?: string;
  upi_id?: string;
}

interface FollowUpRecord {
  id: number;
  patient_name: string;
  visit_date: string;
  hospital_name: string;
  doctor_name?: string | null;
  next_visit_date?: string | null;
  total_bill_amount?: number | string;
  payment_mode?: 'self_pay' | 'insurance' | 'partial';
  payment_account_id?: number | null;
  self_pay_amount?: number | string;
  payment_method?: string | null;
  remarks?: string | null;
  insurance_company?: string | null;
  insurance_approved_amount?: number | string;
  lab_result_file?: string | null;
  prescription_file?: string | null;
  created_at?: string;

  account_name?: string;
  account_type?: AccountType;
  account_bank_name?: string;
  account_upi_id?: string;
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  cash: <Wallet size={14} />,
  bank: <Landmark size={14} />,
  upi: <Smartphone size={14} />,
  credit_card: <CreditCard size={14} />,
  bank_transfer: <ArrowLeftRight size={14} />,
};

const HospitalFollowUp: React.FC = () => {
  const [records, setRecords] = useState<FollowUpRecord[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [patients, setPatients] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'overdue' | 'today'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FollowUpRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Document Viewer Modal State
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const [form, setForm] = useState({
    patient_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    hospital_name: '',
    doctor_name: '',
    next_visit_date: '',
    total_bill_amount: '',
    payment_mode: 'self_pay' as 'self_pay' | 'insurance' | 'partial',
    payment_account_id: '',
    self_pay_amount: '',
    payment_method: '',
    remarks: '',
    insurance_company: '',
    insurance_approved_amount: '',
    lab_result_file: '',
    prescription_file: ''
  });

  useEffect(() => {
    fetchFollowUps();
    fetchPaymentAccounts();
  }, []);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hospital/follow-ups');
      setRecords(res.data.data || []);
      setPatients(res.data.patients || []);
      setHospitals(res.data.hospitals || []);
      setDoctors(res.data.doctors || []);
    } catch (error) {
      console.error('Error fetching hospital follow-ups:', error);
      toast.error('Failed to load follow-up records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      const res = await api.get('/payment-accounts');
      let accountsList: PaymentAccount[] = [];
      if (Array.isArray(res.data)) {
        accountsList = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        accountsList = res.data.data;
      } else if (res.data && Array.isArray(res.data.accounts)) {
        accountsList = res.data.accounts;
      }
      setPaymentAccounts(accountsList);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
    }
  };

  const resetForm = () => {
    setForm({
      patient_name: '',
      visit_date: new Date().toISOString().split('T')[0],
      hospital_name: '',
      doctor_name: '',
      next_visit_date: '',
      total_bill_amount: '',
      payment_mode: 'self_pay',
      payment_account_id: '',
      self_pay_amount: '',
      payment_method: '',
      remarks: '',
      insurance_company: '',
      insurance_approved_amount: '',
      lab_result_file: '',
      prescription_file: ''
    });
    setEditingRecord(null);
  };

  const handleOpenCreateModal = async () => {
    resetForm();
    await fetchPaymentAccounts();
    if (selectedPatient !== 'all') {
      setForm(prev => ({ ...prev, patient_name: selectedPatient }));
    }
    if (selectedHospital !== 'all') {
      setForm(prev => ({ ...prev, hospital_name: selectedHospital }));
    }
    if (selectedDoctor !== 'all') {
      setForm(prev => ({ ...prev, doctor_name: selectedDoctor }));
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (rec: FollowUpRecord) => {
    await fetchPaymentAccounts();
    setEditingRecord(rec);
    setForm({
      patient_name: rec.patient_name,
      visit_date: rec.visit_date ? new Date(rec.visit_date).toISOString().split('T')[0] : '',
      hospital_name: rec.hospital_name,
      doctor_name: rec.doctor_name || '',
      next_visit_date: rec.next_visit_date ? new Date(rec.next_visit_date).toISOString().split('T')[0] : '',
      total_bill_amount: String(rec.total_bill_amount || ''),
      payment_mode: rec.payment_mode || 'self_pay',
      payment_account_id: rec.payment_account_id ? String(rec.payment_account_id) : '',
      self_pay_amount: String(rec.self_pay_amount || ''),
      payment_method: rec.payment_method || '',
      remarks: rec.remarks || '',
      insurance_company: rec.insurance_company || '',
      insurance_approved_amount: String(rec.insurance_approved_amount || ''),
      lab_result_file: rec.lab_result_file || '',
      prescription_file: rec.prescription_file || ''
    });
    setIsModalOpen(true);
  };

  const selectedAccountObj = useMemo(() => {
    if (!form.payment_account_id) return null;
    return paymentAccounts.find(pa => String(pa.id) === String(form.payment_account_id)) || null;
  }, [form.payment_account_id, paymentAccounts]);

  const linkedBankList = useMemo(() => {
    if (!selectedAccountObj || selectedAccountObj.account_type !== 'upi' || !selectedAccountObj.bank_name) return [];
    return selectedAccountObj.bank_name.split(',').map(b => b.trim()).filter(Boolean);
  }, [selectedAccountObj]);

  // Handle Bill & Insurance Calculation updates
  const handleBillOrInsuranceChange = (field: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      const bill = parseFloat(updated.total_bill_amount) || 0;
      const ins = parseFloat(updated.insurance_approved_amount) || 0;

      if (updated.payment_mode === 'self_pay') {
        updated.self_pay_amount = String(bill);
      } else if (updated.payment_mode === 'insurance') {
        updated.self_pay_amount = '0';
        updated.insurance_approved_amount = String(bill);
      } else if (updated.payment_mode === 'partial') {
        const remaining = Math.max(0, bill - ins);
        updated.self_pay_amount = String(remaining);
      }
      return updated;
    });
  };

  const handleModeChange = (mode: 'self_pay' | 'insurance' | 'partial') => {
    if (paymentAccounts.length === 0) fetchPaymentAccounts();
    setForm(prev => {
      const bill = parseFloat(prev.total_bill_amount) || 0;
      const ins = parseFloat(prev.insurance_approved_amount) || 0;
      let selfAmount = '0';
      let insAmount = prev.insurance_approved_amount;

      if (mode === 'self_pay') {
        selfAmount = String(bill);
      } else if (mode === 'insurance') {
        selfAmount = '0';
        insAmount = String(bill);
      } else if (mode === 'partial') {
        selfAmount = String(Math.max(0, bill - ins));
      }

      return {
        ...prev,
        payment_mode: mode,
        self_pay_amount: selfAmount,
        insurance_approved_amount: insAmount
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'lab_result_file' | 'prescription_file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size should be less than 20MB');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setForm(prev => ({ ...prev, [fieldName]: compressedDataUrl }));
            toast.success(`${fieldName === 'lab_result_file' ? 'Lab result' : 'Prescription'} attached`);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [fieldName]: reader.result as string }));
        toast.success(`${fieldName === 'lab_result_file' ? 'Lab result' : 'Prescription'} attached`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.patient_name || !form.hospital_name || !form.visit_date) {
      toast.error('Please fill in Patient Name, Hospital Name, and Visit Date');
      return;
    }

    if ((form.payment_mode === 'self_pay' || form.payment_mode === 'partial') && parseFloat(form.self_pay_amount) > 0 && !form.payment_account_id) {
      toast.error('Please select a Payment Account for the self-paid amount');
      return;
    }

    if (linkedBankList.length > 1 && !form.payment_method && parseFloat(form.self_pay_amount) > 0) {
      toast.error('Please select the specific linked bank account for this UPI transaction');
      return;
    }

    setSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/hospital/follow-ups/${editingRecord.id}`, form);
        toast.success('Follow-up record updated');
      } else {
        await api.post('/hospital/follow-ups', form);
        toast.success('Follow-up record created');
      }
      setIsModalOpen(false);
      resetForm();
      fetchFollowUps();
    } catch (error: any) {
      console.error('Error saving follow-up:', error);
      toast.error(error.response?.data?.message || 'Failed to save follow-up record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, patientName: string) => {
    if (!window.confirm(`Delete follow-up record for ${patientName}?`)) return;
    try {
      await api.delete(`/hospital/follow-ups/${id}`);
      toast.success('Follow-up record deleted');
      fetchFollowUps();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast.error('Failed to delete follow-up record');
    }
  };

  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return records.filter(r => {
      if (selectedPatient !== 'all' && r.patient_name.toLowerCase() !== selectedPatient.toLowerCase()) return false;
      if (selectedHospital !== 'all' && r.hospital_name.toLowerCase() !== selectedHospital.toLowerCase()) return false;
      if (selectedDoctor !== 'all' && (r.doctor_name || '').toLowerCase() !== selectedDoctor.toLowerCase()) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const mPatient = r.patient_name.toLowerCase().includes(term);
        const mHospital = r.hospital_name.toLowerCase().includes(term);
        const mDoctor = (r.doctor_name || '').toLowerCase().includes(term);
        const mRemarks = (r.remarks || '').toLowerCase().includes(term);
        const mInsurance = (r.insurance_company || '').toLowerCase().includes(term);
        if (!mPatient && !mHospital && !mDoctor && !mRemarks && !mInsurance) return false;
      }

      if (dateFilter !== 'all') {
        if (!r.next_visit_date) return false;
        const nextStr = new Date(r.next_visit_date).toISOString().split('T')[0];

        if (dateFilter === 'today' && nextStr !== todayStr) return false;
        if (dateFilter === 'upcoming' && nextStr < todayStr) return false;
        if (dateFilter === 'overdue' && nextStr >= todayStr) return false;
      }

      return true;
    });
  }, [records, selectedPatient, selectedHospital, selectedDoctor, searchTerm, dateFilter]);

  const summaryMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalCount = records.length;
    const upcomingCount = records.filter(r => r.next_visit_date && new Date(r.next_visit_date).toISOString().split('T')[0] >= todayStr).length;
    const totalBill = records.reduce((sum, r) => sum + Number(r.total_bill_amount || 0), 0);
    const insuranceApprovedTotal = records.reduce((sum, r) => sum + Number(r.insurance_approved_amount || 0), 0);
    const uniquePatients = new Set(records.map(r => r.patient_name.trim())).size;

    return {
      totalCount,
      upcomingCount,
      totalBill,
      insuranceApprovedTotal,
      uniquePatients
    };
  }, [records]);

  const getNextDateBadge = (nextDateStr?: string | null) => {
    if (!nextDateStr) return <span className="text-gray-400 text-xs">— No follow-up set</span>;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetStr = new Date(nextDateStr).toISOString().split('T')[0];

    const formattedDate = new Date(nextDateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    if (targetStr === todayStr) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Clock size={12} /> Today ({formattedDate})
        </span>
      );
    }

    if (targetStr < todayStr) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle size={12} /> Overdue ({formattedDate})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Calendar size={12} /> Next: {formattedDate}
      </span>
    );
  };

  const renderAccountSelector = () => (
    <div className="space-y-2.5">
      <label className="block text-xs font-bold text-gray-700">Select Payment Account *</label>

      {paymentAccounts.length === 0 && (
        <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
          <span className="text-amber-800 font-medium">No accounts loaded yet.</span>
          <button
            type="button"
            onClick={() => fetchPaymentAccounts()}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm"
          >
            🔄 Load Payment Accounts
          </button>
        </div>
      )}

      {/* Dropdown Select */}
      <select
        value={form.payment_account_id}
        onChange={e => setForm(f => ({ ...f, payment_account_id: e.target.value, payment_method: '' }))}
        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
      >
        <option value="">-- Choose Payment Account --</option>
        {paymentAccounts.map(pa => (
          <option key={pa.id} value={pa.id}>
            {pa.account_name} ({pa.account_type.toUpperCase()}) {pa.bank_name ? `- ${pa.bank_name}` : ''}
          </option>
        ))}
      </select>

      {/* Interactive Account Cards */}
      {paymentAccounts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
          {paymentAccounts.map((account) => {
            const isSelected = String(form.payment_account_id) === String(account.id);
            return (
              <button
                type="button"
                key={account.id}
                onClick={() => setForm(f => ({ ...f, payment_account_id: String(account.id), payment_method: '' }))}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {ACCOUNT_ICONS[account.account_type || 'cash']}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate leading-tight">{account.account_name}</p>
                  <p className="text-[10px] text-gray-400 truncate uppercase mt-0.5">{account.account_type}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Linked Bank Picker if UPI Account with multiple banks */}
      {linkedBankList.length > 1 && (
        <div className="p-3 bg-violet-50/80 border border-violet-200 rounded-xl space-y-2 mt-2">
          <label className="block text-xs font-extrabold text-violet-900">
            Choose Bank for this Transaction *
          </label>
          <div className="flex flex-wrap gap-2">
            {linkedBankList.map(bank => {
              const isSelected = form.payment_method === bank;
              return (
                <button
                  type="button"
                  key={bank}
                  onClick={() => setForm(f => ({ ...f, payment_method: bank }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-violet-700 text-white border-violet-800 shadow-sm'
                      : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-100'
                  }`}
                >
                  🏦 {bank}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50/60 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Stethoscope className="text-indigo-600" size={28} /> Patient Follow-Ups & Medical History
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track follow-up dates, doctor consultations, bills, insurance approvals, lab results, and prescriptions.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={18} /> Add Follow-Up Visit
        </button>
      </header>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Hospital Bills</p>
            <h2 className="text-2xl font-black text-gray-900 mt-1">₹{summaryMetrics.totalBill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{summaryMetrics.totalCount} visit records</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Upcoming Appointments</p>
            <h2 className="text-3xl font-black text-emerald-700 mt-1">{summaryMetrics.upcomingCount}</h2>
            <p className="text-xs text-emerald-600/80 mt-0.5">Scheduled follow-up dates</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Insurance Approved</p>
            <h2 className="text-2xl font-black text-violet-800 mt-1">₹{summaryMetrics.insuranceApprovedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <p className="text-xs text-violet-500 mt-0.5">Total claims approved</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Patients</p>
            <h2 className="text-3xl font-black text-blue-800 mt-1">{summaryMetrics.uniquePatients}</h2>
            <p className="text-xs text-blue-500 mt-0.5">Unique patients tracked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search patient, doctor, hospital, insurance..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Patient Filter */}
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">👤 All Patients</option>
            {patients.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Hospital Filter */}
          <select
            value={selectedHospital}
            onChange={e => setSelectedHospital(e.target.value)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">🏥 All Hospitals</option>
            {hospitals.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          {/* Doctor Filter */}
          <select
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">🩺 All Doctors</option>
            {doctors.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Follow-up Date Filter */}
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">📅 All Visit Dates</option>
            <option value="today">🟢 Today's Follow-up</option>
            <option value="upcoming">🔵 Upcoming Next Visits</option>
            <option value="overdue">🔴 Overdue Follow-ups</option>
          </select>
        </div>
      </div>

      {/* Main Records List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 space-y-3">
          <Stethoscope size={48} className="opacity-30 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">No follow-up records found</h3>
          <p className="text-xs text-gray-500 max-w-sm">
            Click "Add Follow-Up Visit" to record patient visits, bills, next follow-up dates, insurance details, lab results, and prescriptions.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
          >
            + Add Follow-Up Visit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      {rec.patient_name}
                      {Number(rec.total_bill_amount || 0) > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          🧾 Bill: ₹{Number(rec.total_bill_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                      <span>Visited: <strong>{new Date(rec.visit_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                      <span>•</span>
                      <span>🏥 <strong>{rec.hospital_name}</strong></span>
                      {rec.doctor_name && (
                        <>
                          <span>•</span>
                          <span>🩺 <strong>Dr. {rec.doctor_name}</strong></span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {getNextDateBadge(rec.next_visit_date)}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(rec)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit Follow-Up"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id, rec.patient_name)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Details & Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Payment & Insurance Info */}
                <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-100 space-y-1.5">
                  <p className="font-bold text-violet-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <ShieldCheck size={13} className="text-violet-600" /> Payment & Claim Summary
                  </p>

                  {rec.payment_mode === 'self_pay' && (
                    <div className="text-xs space-y-0.5">
                      <p className="text-gray-600 font-medium">Mode: <strong className="text-emerald-700">💳 Self Paid (Cash/Bank)</strong></p>
                      {rec.account_name && (
                        <p className="text-gray-800 font-bold flex items-center gap-1">
                          {ACCOUNT_ICONS[rec.account_type || 'cash']} {rec.account_name}
                          {rec.payment_method && <span className="text-[10px] text-indigo-700 font-mono">({rec.payment_method})</span>}
                        </p>
                      )}
                    </div>
                  )}

                  {rec.payment_mode === 'insurance' && (
                    <div className="text-xs space-y-0.5">
                      <p className="text-gray-600 font-medium">Mode: <strong className="text-violet-700">🛡️ Full Insurance Claim</strong></p>
                      <p className="text-gray-800 font-bold">{rec.insurance_company || 'Insurance Provider'}</p>
                      <p className="text-violet-800 font-black">Approved: ₹{Number(rec.insurance_approved_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}

                  {rec.payment_mode === 'partial' && (
                    <div className="text-xs space-y-1">
                      <p className="text-gray-600 font-medium">Mode: <strong className="text-indigo-700">⚖️ Insurance + Self Pay</strong></p>
                      <p className="text-violet-800 font-bold">🛡️ {rec.insurance_company}: ₹{Number(rec.insurance_approved_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      {Number(rec.self_pay_amount || 0) > 0 && (
                        <p className="text-emerald-800 font-bold flex items-center gap-1">
                          💳 Self Balance: ₹{Number(rec.self_pay_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          {rec.account_name && ` (${rec.account_name}${rec.payment_method ? ` - ${rec.payment_method}` : ''})`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Document Attachments */}
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 col-span-1 md:col-span-2">
                  <p className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Paperclip size={13} className="text-indigo-600" /> Uploaded Medical Documents
                  </p>
                  <div className="flex items-center gap-3 flex-wrap pt-0.5">
                    {rec.lab_result_file ? (
                      <button
                        onClick={() => setPreviewDoc({ title: `Lab Result - ${rec.patient_name}`, url: rec.lab_result_file! })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-sm"
                      >
                        <Eye size={13} /> View Lab Result 🧪
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No Lab Result uploaded</span>
                    )}

                    {rec.prescription_file ? (
                      <button
                        onClick={() => setPreviewDoc({ title: `Prescription - ${rec.patient_name}`, url: rec.prescription_file! })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm"
                      >
                        <Eye size={13} /> View Prescription 📋
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No Prescription uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {rec.remarks && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                  <span className="font-bold text-gray-900">Remarks / Doctor Advice: </span>
                  {rec.remarks}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Follow-Up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope size={20} className="text-indigo-600" />
                {editingRecord ? 'Edit Follow-Up Visit' : 'Add Patient Follow-Up Visit'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vishnu Mohan"
                    value={form.patient_name}
                    onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Visited Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Visited Date *</label>
                  <input
                    type="date"
                    required
                    value={form.visit_date}
                    onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Hospital Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Hospital Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aster Medcity / AIIMS"
                    value={form.hospital_name}
                    onChange={e => setForm(f => ({ ...f, hospital_name: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Doctor Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={form.doctor_name}
                    onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Next Follow-Up Date */}
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1.5">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={form.next_visit_date}
                    onChange={e => setForm(f => ({ ...f, next_visit_date: e.target.value }))}
                    className="w-full p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Total Hospital Bill Amount */}
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1.5">Hospital Bill Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.total_bill_amount}
                    onChange={e => handleBillOrInsuranceChange('total_bill_amount', e.target.value)}
                    className="w-full p-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Payment Mode Selection Dropdown */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Payment Mode & Breakdown
                </label>
                <select
                  value={form.payment_mode}
                  onChange={e => handleModeChange(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="self_pay">💳 Paid by Self (Cash / Bank Account)</option>
                  <option value="insurance">🛡️ Paid by Insurance Company</option>
                  <option value="partial">⚖️ Partial Insurance + Self Pay Balance</option>
                </select>

                {/* Self Pay Mode options */}
                {form.payment_mode === 'self_pay' && (
                  <div className="pt-2">
                    {renderAccountSelector()}
                  </div>
                )}

                {/* Insurance Full Mode options */}
                {form.payment_mode === 'insurance' && (
                  <div className="space-y-2 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Insurance Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Star Health / ICICI Lombard"
                        value={form.insurance_company}
                        onChange={e => setForm(f => ({ ...f, insurance_company: e.target.value }))}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[11px] text-violet-700 font-semibold pt-1 flex items-center gap-1">
                      🛡️ Full Coverage: Insurance company pays 100% of the bill (₹{Number(form.total_bill_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}).
                    </p>
                  </div>
                )}

                {/* Partial Insurance + Self Pay Mode options */}
                {form.payment_mode === 'partial' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Insurance Company Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Star Health / ICICI Lombard"
                          value={form.insurance_company}
                          onChange={e => setForm(f => ({ ...f, insurance_company: e.target.value }))}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-violet-900 mb-1.5">Insurance Approved Amount (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.insurance_approved_amount}
                          onChange={e => handleBillOrInsuranceChange('insurance_approved_amount', e.target.value)}
                          className="w-full p-2.5 bg-white border border-violet-200 rounded-xl text-sm font-black text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Self Pay Balance (Out of Pocket)</span>
                        <span className="text-sm font-black text-emerald-800">
                          ₹{Number(form.self_pay_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {parseFloat(form.self_pay_amount) > 0 && (
                        <div className="pt-1">
                          {renderAccountSelector()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Remarks / Doctor Advice</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take medicines after food, review lab reports next week"
                  value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* File Upload Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                {/* Lab Result Upload */}
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-indigo-900">Lab Result Document Upload</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => handleFileUpload(e, 'lab_result_file')}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  />
                  {form.lab_result_file && (
                    <div className="flex items-center justify-between text-[11px] text-indigo-700 font-semibold bg-white p-1.5 rounded-lg border border-indigo-200">
                      <span>✓ Lab Result Attached</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, lab_result_file: '' }))} className="text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>

                {/* Prescription Upload */}
                <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-emerald-900">Prescription Upload</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => handleFileUpload(e, 'prescription_file')}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  {form.prescription_file && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold bg-white p-1.5 rounded-lg border border-emerald-200">
                      <span>✓ Prescription Attached</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, prescription_file: '' }))} className="text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Follow-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download="medical_document"
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                >
                  <Download size={13} /> Download
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100">
              {previewDoc.url.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[65vh] rounded-lg border border-gray-300" title="Document Preview" />
              ) : (
                <img src={previewDoc.url} alt="Medical Document" className="max-h-[65vh] object-contain rounded-lg shadow" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalFollowUp;
