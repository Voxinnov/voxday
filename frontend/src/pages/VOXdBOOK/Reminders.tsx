import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    BellRing,
    CheckCircle,
    X
} from 'lucide-react';
import api from '../../services/smartApi';

interface Reminder {
    id: number;
    title: string;
    description?: string;
    event_date: string;
    event_time?: string;
    status: 'pending' | 'completed';
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const defaultForm = {
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '',
        status: 'pending' as 'pending' | 'completed',
    };

    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reminders');
            setReminders(response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (reminder: Reminder | null = null, date: Date | null = null) => {
        if (reminder) {
            setEditingReminder(reminder);
            setFormData({
                title: reminder.title,
                description: reminder.description || '',
                event_date: new Date(reminder.event_date).toISOString().split('T')[0],
                event_time: reminder.event_time || '',
                status: reminder.status,
            });
        } else {
            setEditingReminder(null);
            setFormData({
                ...defaultForm,
                event_date: date
                    ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingReminder) {
                await api.put(`/reminders/${editingReminder.id}`, formData);
            } else {
                await api.post('/reminders', formData);
            }
            fetchReminders();
            setIsModalOpen(false);
        } catch (error: any) {
            alert('Error saving reminder: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this reminder?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            fetchReminders();
        } catch {
            alert('Error deleting reminder');
        }
    };

    const toggleStatus = async (reminder: Reminder) => {
        try {
            const newStatus = reminder.status === 'pending' ? 'completed' : 'pending';
            await api.put(`/reminders/${reminder.id}`, { ...reminder, status: newStatus });
            fetchReminders();
        } catch {
            alert('Error updating status');
        }
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    // Build calendar grid
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const paddingDays = Array.from({ length: firstDay }, (_, i) => i);
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Filter for list
    const filteredReminders = reminders.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRemindersForDate = (day: number) => {
        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return reminders.filter(r => r.event_date.startsWith(targetDateStr));
    };

    const selectedDateStr = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : null;

    const remindersForSelectedDate = selectedDateStr
        ? reminders.filter(r => r.event_date.startsWith(selectedDateStr))
        : [];

    return (
        <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BellRing size={22} className="text-pink-600" />
                        Reminders
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Calendar events and alerts</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm"
                    onClick={() => handleOpenModal()}
                >
                    <Plus size={18} />
                    Add Reminder
                </button>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: Calendar */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        {/* Calendar Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()) }}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 text-sm font-semibold transition-colors"
                                >
                                    Today
                                </button>
                                <button onClick={nextMonth} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day} className="text-center text-xs font-bold tracking-wider text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {paddingDays.map(i => (
                                <div key={`padding-${i}`} className="h-20 sm:h-24 bg-gray-50/50 rounded-lg border border-transparent"></div>
                            ))}
                            {monthDays.map(day => {
                                const dayDate = new Date(year, month, day);
                                const isToday = isSameDay(dayDate, new Date());
                                const isSelected = selectedDate ? isSameDay(dayDate, selectedDate) : false;
                                const dayReminders = getRemindersForDate(day);

                                return (
                                    <div
                                        key={`day-${day}`}
                                        onClick={() => setSelectedDate(dayDate)}
                                        onDoubleClick={() => handleOpenModal(null, dayDate)}
                                        className={`h-20 sm:h-24 p-1.5 flex flex-col cursor-pointer transition-all border rounded-lg ${isSelected
                                            ? 'bg-pink-50 border-pink-200 shadow-sm'
                                            : isToday
                                                ? 'bg-amber-50 border-amber-200 shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-pink-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white' : isSelected ? 'bg-pink-500 text-white' : 'text-gray-700'
                                                }`}>
                                                {day}
                                            </span>
                                            {dayReminders.length > 0 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1 mr-1"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto invisible-scrollbar space-y-1">
                                            {dayReminders.map(r => (
                                                <div
                                                    key={r.id}
                                                    className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium ${r.status === 'completed' ? 'bg-gray-100 text-gray-400 line-through' : 'bg-indigo-50 text-indigo-700'
                                                        }`}
                                                >
                                                    {r.event_time ? `${r.event_time.slice(0, 5)} ` : ''}{r.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: List View */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
                            <span>{selectedDate ? selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All Events'}</span>
                            <span className="text-xs font-semibold px-2 py-1 bg-pink-50 text-pink-600 rounded-lg">
                                {remindersForSelectedDate.length} item{remindersForSelectedDate.length !== 1 ? 's' : ''}
                            </span>
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {loading ? (
                                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
                            ) : remindersForSelectedDate.length === 0 ? (
                                <div className="text-center py-10">
                                    <Calendar size={32} className="mx-auto mb-3 text-gray-200" />
                                    <p className="text-gray-500 text-sm font-medium">No events for this day</p>
                                    <button
                                        onClick={() => handleOpenModal(null, selectedDate)}
                                        className="mt-3 text-sm text-pink-600 font-semibold hover:text-pink-700"
                                    >
                                        + Add an event
                                    </button>
                                </div>
                            ) : (
                                remindersForSelectedDate.map(reminder => (
                                    <div key={reminder.id} className={`p-4 rounded-xl border transition-all flex gap-3 ${reminder.status === 'completed' ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-pink-100 shadow-sm'
                                        }`}>
                                        <button
                                            onClick={() => toggleStatus(reminder)}
                                            className={`flex-shrink-0 mt-0.5 ${reminder.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-pink-400'}`}
                                        >
                                            <CheckCircle size={20} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-bold truncate ${reminder.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                {reminder.title}
                                            </h4>
                                            {reminder.event_time && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Clock size={12} />
                                                    {reminder.event_time.slice(0, 5)}
                                                </div>
                                            )}
                                            {reminder.description && (
                                                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{reminder.description}</p>
                                            )}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                                                <button
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                                    onClick={() => handleOpenModal(reminder)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(reminder.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search all reminders..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {searchTerm && (
                                <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                                    {filteredReminders.map(r => (
                                        <div key={`search-${r.id}`} className="bg-gray-50 p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100" onClick={() => {
                                            setSelectedDate(new Date(r.event_date));
                                            setCurrentDate(new Date(r.event_date));
                                            setSearchTerm('');
                                        }}>
                                            <div className="truncate pr-2">
                                                <p className="text-xs font-bold text-gray-900 truncate">{r.title}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(r.event_date).toLocaleDateString()}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl z-10">
                            <div className="flex items-center gap-2">
                                <BellRing size={18} className="text-pink-600" />
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Event Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="Meeting, Birthday, Task..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        value={formData.event_date}
                                        onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Time</label>
                                    <input
                                        type="time"
                                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        value={formData.event_time}
                                        onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <textarea
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                                    rows={3}
                                    placeholder="Add details..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

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
                                    className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all"
                                >
                                    {editingReminder ? 'Update' : 'Save Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reminders;
