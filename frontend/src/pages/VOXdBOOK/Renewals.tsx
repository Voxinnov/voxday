import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    Phone,
    User,
    Calendar,
    X
} from 'lucide-react';
import api from '../../services/smartApi';

interface Renewal {
    id: number;
    category: string;
    provider: string;
    amount: number | string;
    agent_name?: string;
    agent_number?: string;
    renewal_frequency: 'monthly' | 'yearly';
    next_renewal_date: string;
    last_renewal_date?: string;
    remark?: string;
    status: 'active' | 'inactive';
    created_at?: string;
}

const CATEGORY_PRESETS = [
    'Health Insurance',
    'Car Insurance',
    'Bike Insurance',
    'Vehicle Pollution (PUC)',
    'Life Insurance',
    'Home Insurance',
    'Travel Insurance',
    'Domain Renewal',
    'Hosting Renewal',
    'Software License',
    'Other',
];

const getDaysUntil = (dateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getStatusInfo = (renewal: Renewal) => {
    const days = getDaysUntil(renewal.next_renewal_date);
    if (renewal.status === 'inactive') return { label: 'Inactive', color: 'gray', urgent: false };
    if (days < 0) return { label: 'Overdue', color: 'red', urgent: true };
    if (days <= 30) return { label: `${days}d left`, color: 'amber', urgent: true };
    return { label: `${days}d left`, color: 'green', urgent: false };
};

const Renewals: React.FC = () => {
    const [renewals, setRenewals] = useState<Renewal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRenewal, setEditingRenewal] = useState<Renewal | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'urgent' | 'active' | 'inactive'>('all');

    const defaultForm = {
        category: '',
        provider: '',
        amount: '',
        agent_name: '',
        agent_number: '',
        renewal_frequency: 'yearly' as 'monthly' | 'yearly',
        next_renewal_date: '',
        last_renewal_date: '',
        remark: '',
        status: 'active' as 'active' | 'inactive',
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        fetchRenewals();
    }, []);

    const fetchRenewals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/renewals');
            setRenewals(response.data);
        } catch (error) {
            console.error('Error fetching renewals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (renewal: Renewal | null = null) => {
        if (renewal) {
            setEditingRenewal(renewal);
            setFormData({
                category: renewal.category,
                provider: renewal.provider,
                amount: String(renewal.amount),
                agent_name: renewal.agent_name || '',
                agent_number: renewal.agent_number || '',
                renewal_frequency: renewal.renewal_frequency,
                next_renewal_date: renewal.next_renewal_date
                    ? new Date(renewal.next_renewal_date).toISOString().split('T')[0]
                    : '',
                last_renewal_date: renewal.last_renewal_date
                    ? new Date(renewal.last_renewal_date).toISOString().split('T')[0]
                    : '',
                remark: renewal.remark || '',
                status: renewal.status,
            });
        } else {
            setEditingRenewal(null);
            setFormData(defaultForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                last_renewal_date: formData.last_renewal_date || null,
            };
            if (editingRenewal) {
                await api.put(`/renewals/${editingRenewal.id}`, payload);
            } else {
                await api.post('/renewals', payload);
            }
            fetchRenewals();
            setIsModalOpen(false);
        } catch (error: any) {
            alert('Error saving renewal: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this renewal?')) return;
        try {
            await api.delete(`/renewals/${id}`);
            fetchRenewals();
        } catch {
            alert('Error deleting renewal');
        }
    };

    const filteredRenewals = renewals.filter(r => {
        const matchSearch =
            r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.agent_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'urgent') {
            const days = getDaysUntil(r.next_renewal_date);
            return matchSearch && r.status === 'active' && days <= 30;
        }
        if (filterStatus === 'active') return matchSearch && r.status === 'active';
        if (filterStatus === 'inactive') return matchSearch && r.status === 'inactive';
        return matchSearch;
    });

    // Stats
    const totalActive = renewals.filter(r => r.status === 'active').length;
    const urgentCount = renewals.filter(r => {
        const days = getDaysUntil(r.next_renewal_date);
        return r.status === 'active' && days <= 30;
    }).length;
    const overdueCount = renewals.filter(r => {
        const days = getDaysUntil(r.next_renewal_date);
        return r.status === 'active' && days < 0;
    }).length;
    const totalAmount = renewals
        .filter(r => r.status === 'active')
        .reduce((sum, r) => sum + Number(r.amount), 0);

    return (
        <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <RefreshCw size={22} className="text-indigo-600" />
                        Renewal Reminders
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track insurance, subscriptions & annual renewals</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={18} />
                    Add Renewal
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active</p>
                            <p className="text-xl font-bold text-gray-900">{totalActive}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Due Soon</p>
                            <p className="text-xl font-bold text-gray-900">{urgentCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Overdue</p>
                            <p className="text-xl font-bold text-gray-900">{overdueCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <span className="text-sm font-bold">₹</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Value</p>
                            <p className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by category, provider or agent..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'urgent', 'active', 'inactive'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${filterStatus === f
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'urgent' ? '⚠ Due Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Renewal</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-40" />
                                        Loading renewals...
                                    </td>
                                </tr>
                            ) : filteredRenewals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <RefreshCw size={32} className="mx-auto mb-3 text-gray-200" />
                                        <p className="text-gray-400 font-medium">No renewals found</p>
                                        <p className="text-gray-300 text-sm mt-1">Click "Add Renewal" to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRenewals.map(renewal => {
                                    const statusInfo = getStatusInfo(renewal);
                                    const days = getDaysUntil(renewal.next_renewal_date);
                                    return (
                                        <tr key={renewal.id} className={`hover:bg-gray-50 transition-colors ${statusInfo.urgent ? 'border-l-2 border-l-amber-400' : ''}`}>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                                                    {renewal.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">{renewal.provider}</td>
                                            <td className="px-5 py-4">
                                                {renewal.agent_name ? (
                                                    <div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-700">
                                                            <User size={12} className="text-gray-400" />
                                                            {renewal.agent_name}
                                                        </div>
                                                        {renewal.agent_number && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                                <Phone size={11} />
                                                                {renewal.agent_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900">
                                                ₹{Number(renewal.amount).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${renewal.renewal_frequency === 'yearly'
                                                        ? 'bg-purple-50 text-purple-700'
                                                        : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {renewal.renewal_frequency === 'yearly' ? '📅 Yearly' : '🗓 Monthly'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm text-gray-700 font-medium">
                                                            {new Date(renewal.next_renewal_date).toLocaleDateString('en-IN', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className={`text-xs font-medium ${days < 0 ? 'text-red-500' :
                                                                days <= 30 ? 'text-amber-500' : 'text-gray-400'
                                                            }`}>
                                                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `in ${days} days`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${renewal.status === 'inactive'
                                                        ? 'bg-gray-100 text-gray-500'
                                                        : days < 0
                                                            ? 'bg-red-100 text-red-700'
                                                            : days <= 30
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {renewal.status === 'inactive' ? '○' : days < 0 ? '⚠' : days <= 30 ? '⚡' : '●'}
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button
                                                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                                                        onClick={() => handleOpenModal(renewal)}
                                                        title="Edit"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                                        onClick={() => handleDelete(renewal.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Remarks section for items with remarks */}
            {filteredRenewals.some(r => r.remark) && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRenewals.filter(r => r.remark).map(renewal => (
                        <div key={`remark-${renewal.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">{renewal.category}</span>
                                <span className="text-xs text-gray-400">{renewal.provider}</span>
                            </div>
                            <p className="text-sm text-gray-600 italic">"{renewal.remark}"</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl z-10">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={18} className="text-indigo-600" />
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingRenewal ? 'Edit Renewal' : 'Add Renewal Reminder'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Category <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={CATEGORY_PRESETS.includes(formData.category) ? formData.category : 'Other'}
                                        onChange={e => {
                                            if (e.target.value !== 'Other') {
                                                setFormData({ ...formData, category: e.target.value });
                                            } else {
                                                setFormData({ ...formData, category: '' });
                                            }
                                        }}
                                    >
                                        {CATEGORY_PRESETS.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                {(!CATEGORY_PRESETS.includes(formData.category) || formData.category === '') && (
                                    <input
                                        type="text"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter custom category..."
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                )}
                            </div>

                            {/* Provider */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Provided By <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. Star Health, HDFC ERGO..."
                                    value={formData.provider}
                                    onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Amount + Frequency */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Amount (₹) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Frequency</label>
                                    <select
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.renewal_frequency}
                                        onChange={e => setFormData({ ...formData, renewal_frequency: e.target.value as 'monthly' | 'yearly' })}
                                    >
                                        <option value="yearly">Yearly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>

                            {/* Agent Name + Number */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Agent Name</label>
                                    <input
                                        type="text"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Agent name"
                                        value={formData.agent_name}
                                        onChange={e => setFormData({ ...formData, agent_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Agent Number</label>
                                    <input
                                        type="tel"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="+91 00000 00000"
                                        value={formData.agent_number}
                                        onChange={e => setFormData({ ...formData, agent_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Next Renewal + Last Renewal */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Next Renewal Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.next_renewal_date}
                                        onChange={e => setFormData({ ...formData, next_renewal_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Last Renewal Date</label>
                                    <input
                                        type="date"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.last_renewal_date}
                                        onChange={e => setFormData({ ...formData, last_renewal_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <div className="flex gap-3">
                                    {(['active', 'inactive'] as const).map(s => (
                                        <label key={s} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="status"
                                                value={s}
                                                checked={formData.status === s}
                                                onChange={() => setFormData({ ...formData, status: s })}
                                                className="text-indigo-600"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">{s}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Remark */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Remark</label>
                                <textarea
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows={3}
                                    placeholder="Any additional notes..."
                                    value={formData.remark}
                                    onChange={e => setFormData({ ...formData, remark: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all"
                                >
                                    {editingRenewal ? 'Update' : 'Save Renewal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Renewals;
