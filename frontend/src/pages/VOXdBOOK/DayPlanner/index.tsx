import React, { useState, useEffect } from 'react';
import { Clock, Calendar, PieChart, Info, Settings, Plus, User, Pencil, Trash2, X, Save, Sun, Moon, AlarmClock } from 'lucide-react';
import api from '../../../services/smartApi';
import toast from 'react-hot-toast';

export default function DayPlanner() {
    const [activeTab, setActiveTab] = useState('schedule');
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        api.get('/dayplanner/profile').then(res => setProfile(res.data)).catch(() => { });
    }, []);

    return (
        <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen pb-20">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Clock className="text-indigo-600" size={32} />
                        Day Planner
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Organize your days and stay disciplined</p>
                </div>
            </header>

            {!profile && activeTab !== 'profile' ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                    <Info size={48} className="mx-auto text-indigo-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to Day Planner</h2>
                    <p className="text-gray-500 mb-6">Please complete your initial setup profile to auto-generate your daily schedule.</p>
                    <button onClick={() => setActiveTab('profile')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition">
                        Create My Profile
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
                        <TabButton icon={<Calendar size={18} />} label="Daily Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                        <TabButton icon={<PieChart size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                        <TabButton icon={<Settings size={18} />} label="Activities Setup" active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} />
                        <TabButton icon={<User size={18} />} label="Profile Setup" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                        {activeTab === 'profile' && <ProfileSetupView current={profile} onSaved={(p: any) => { setProfile(p); setActiveTab('schedule'); }} />}
                        {activeTab === 'schedule' && <ScheduleView />}
                        {activeTab === 'setup' && <ActivitiesSetupView />}
                        {activeTab === 'analytics' && <AnalyticsView />}
                    </div>
                </>
            )}
        </div>
    );
}

function TabButton({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all font-semibold text-sm ${active
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
        >
            {icon} {label}
        </button>
    );
}

// --- VIEWS ---

function ProfileSetupView({ current, onSaved }: { current: any, onSaved: any }) {
    const [form, setForm] = useState({
        name: current?.name || '', gender: current?.gender || 'Male', age: current?.age || '',
        working_type: current?.working_type || 'Full-time', working_day: current?.working_day || 'Mon-Fri',
        off_day: current?.off_day || 'Sat-Sun', wake_up_preference: current?.wake_up_preference || '06:00:00',
        sleep_preference: current?.sleep_preference || '22:30:00'
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/dayplanner/profile', form);
            toast.success('Day Planner Template setup complete!');
            onSaved(form);
        } catch (error) {
            toast.error('Failed to setup profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-4 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Your Day Planner Profile</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                        <input type="text" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                            <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Working Type</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.working_type} onChange={e => setForm({ ...form, working_type: e.target.value })}>
                            <option>Office</option><option>Work from Home</option><option>Hybrid</option><option>Business</option><option>Student</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Age (Optional)</label>
                        <input type="number" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Working Days</label>
                        <input type="text" placeholder="e.g. Mon-Fri" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.working_day} onChange={e => setForm({ ...form, working_day: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Off Days</label>
                        <input type="text" placeholder="e.g. Sat-Sun" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.off_day} onChange={e => setForm({ ...form, off_day: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Wake-up Preference</label>
                        <input type="time" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.wake_up_preference} onChange={e => setForm({ ...form, wake_up_preference: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Sleep Preference</label>
                        <input type="time" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={form.sleep_preference} onChange={e => setForm({ ...form, sleep_preference: e.target.value })} />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">
                    {loading ? 'Saving...' : 'Save Profile & Generate Template'}
                </button>
            </form>
        </div>
    );
}

function ScheduleView() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(todayStr);
    const [mode, setMode] = useState('Working Day');
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        fetchSchedule();
    }, [date, mode]);

    const fetchSchedule = async () => {
        try {
            const res = await api.get(`/dayplanner/logs?date=${date}&mode=${mode}`);
            setSchedule(res.data);
        } catch (error) { toast.error('Error fetching schedule'); }
    };

    const updateStatus = async (activityId: number, status: string, rating: number) => {
        try {
            const res = await api.post('/dayplanner/logs', {
                activity_id: activityId, log_date: date, status, rating
            });
            if (res.data.discipline_assigned) {
                toast(`Discipline Assigned: ${res.data.discipline_assigned}`, { icon: '⚠️' });
            } else { toast.success('Status updated'); }
            fetchSchedule();
        } catch (e) { toast.error('Update failed'); }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex gap-4">
                    <input type="date" className="p-2 border border-indigo-200 rounded-lg text-sm font-medium" value={date} onChange={e => setDate(e.target.value)} />
                    <select className="p-2 border border-indigo-200 bg-white rounded-lg text-sm font-medium text-indigo-800" value={mode} onChange={e => setMode(e.target.value)}>
                        <option>Working Day</option>
                        <option>Off Day</option>
                    </select>
                </div>
                <div className="font-bold text-indigo-900">{schedule.length} Activities</div>
            </div>

            <div className="space-y-4">
                {schedule.map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white items-center">
                        <div className="w-full md:w-32 text-center md:text-left text-sm font-bold text-gray-500 whitespace-nowrap">
                            {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-800">{item.activity_name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <select className="p-2 bg-gray-50 border border-gray-200 rounded text-sm" value={item.log?.status} onChange={(e) => updateStatus(item.id, e.target.value, item.log?.rating)}>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed ✅</option>
                                <option value="Partially Completed">Partial ⏳</option>
                                <option value="Not Completed">Not Done ❌</option>
                            </select>
                            <select className="p-2 bg-gray-50 border border-gray-200 rounded text-sm" value={item.log?.rating || 0} onChange={(e) => updateStatus(item.id, item.log?.status, parseInt(e.target.value))}>
                                <option value={0}>Rate</option><option value={1}>⭐</option><option value={2}>⭐⭐</option><option value={3}>⭐⭐⭐</option><option value={4}>⭐⭐⭐⭐</option><option value={5}>⭐⭐⭐⭐⭐</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Priority badge colors
const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-green-100 text-green-700 border-green-200',
};

const ICONS = ['Sun', 'Moon', 'Coffee', 'Briefcase', 'Book', 'BookOpen', 'Activity', 'Utensils', 'Car', 'Home', 'Wind', 'ChefHat', 'Pill', 'Monitor', 'Lock', 'LogOut', 'Droplets', 'List', 'Star', 'Heart', 'Music', 'Camera', 'Tv'];

const emptyForm = { activity_name: '', start_time: '', end_time: '', priority: 'Medium', icon: 'List', day_mode: 'Working Day', reminder: true };

function ActivitiesSetupView() {
    const [mode, setMode] = useState<'Working Day' | 'Off Day'>('Working Day');
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/dayplanner/activities?mode=${encodeURIComponent(mode)}`);
            setActivities(res.data);
        } catch {
            toast.error('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchActivities(); }, [mode]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.activity_name || !addForm.start_time || !addForm.end_time) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            await api.post('/dayplanner/activities', { ...addForm, day_mode: mode });
            toast.success('Activity added!');
            setShowAdd(false);
            setAddForm({ ...emptyForm });
            fetchActivities();
        } catch {
            toast.error('Failed to add activity');
        } finally { setSaving(false); }
    };

    const startEdit = (act: any) => {
        setEditingId(act.id);
        setEditForm({
            activity_name: act.activity_name,
            start_time: act.start_time?.slice(0, 5),
            end_time: act.end_time?.slice(0, 5),
            priority: act.priority || 'Medium',
            reminder: act.reminder ?? true,
            icon: act.icon || 'List',
        });
    };

    const handleEdit = async (id: number) => {
        if (!editForm.activity_name || !editForm.start_time || !editForm.end_time) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            await api.put(`/dayplanner/activities/${id}`, editForm);
            toast.success('Activity updated!');
            setEditingId(null);
            fetchActivities();
        } catch {
            toast.error('Failed to update activity');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        setDeleting(id);
        try {
            await api.delete(`/dayplanner/activities/${id}`);
            toast.success('Activity deleted');
            setActivities(prev => prev.filter(a => a.id !== id));
        } catch {
            toast.error('Failed to delete activity');
        } finally { setDeleting(null); }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Settings size={22} className="text-indigo-600" /> Activities Manager
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Add, edit, or remove activities from your daily template</p>
                </div>
                <button
                    onClick={() => { setShowAdd(true); setEditingId(null); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition text-sm"
                >
                    <Plus size={18} /> Add Activity
                </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                {(['Working Day', 'Off Day'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setShowAdd(false); setEditingId(null); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {m === 'Working Day' ? <Sun size={15} /> : <Moon size={15} />} {m}
                    </button>
                ))}
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-indigo-800 flex items-center gap-2"><Plus size={18} /> New Activity ({mode})</h3>
                        <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleAdd}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Activity Name *</label>
                                <input
                                    type="text" required
                                    className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    placeholder="e.g. Morning Walk"
                                    value={addForm.activity_name}
                                    onChange={e => setAddForm({ ...addForm, activity_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Time *</label>
                                <input type="time" required className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" value={addForm.start_time} onChange={e => setAddForm({ ...addForm, start_time: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">End Time *</label>
                                <input type="time" required className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" value={addForm.end_time} onChange={e => setAddForm({ ...addForm, end_time: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
                                <select className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" value={addForm.priority} onChange={e => setAddForm({ ...addForm, priority: e.target.value })}>
                                    <option>High</option><option>Medium</option><option>Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Icon</label>
                                <select className="w-full p-2.5 border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" value={addForm.icon} onChange={e => setAddForm({ ...addForm, icon: e.target.value })}>
                                    {ICONS.map(i => <option key={i}>{i}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" id="add-reminder" checked={addForm.reminder} onChange={e => setAddForm({ ...addForm, reminder: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                                <label htmlFor="add-reminder" className="text-sm font-semibold text-gray-700">Enable Reminder</label>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition shadow flex items-center gap-2">
                                {saving ? 'Saving...' : <><Save size={16} /> Save Activity</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Activity List */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 font-medium">Loading activities...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <AlarmClock size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-semibold">No activities for {mode} yet</p>
                    <p className="text-sm mt-1">Click "Add Activity" to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((act: any) => (
                        <div key={act.id} className={`border rounded-xl transition-all ${editingId === act.id ? 'border-indigo-300 bg-indigo-50 shadow-md' : 'border-gray-200 bg-white hover:shadow-sm'}`}>
                            {editingId === act.id && editForm ? (
                                /* Inline Edit */
                                <div className="p-4 animate-fade-in">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-indigo-700 text-sm">Editing Activity</span>
                                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Activity Name</label>
                                            <input type="text" className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={editForm.activity_name} onChange={e => setEditForm({ ...editForm, activity_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Start Time</label>
                                            <input type="time" className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">End Time</label>
                                            <input type="time" className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={editForm.end_time} onChange={e => setEditForm({ ...editForm, end_time: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
                                            <select className="w-full p-2 border border-indigo-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                                                <option>High</option><option>Medium</option><option>Low</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id={`edit-reminder-${act.id}`} checked={editForm.reminder} onChange={e => setEditForm({ ...editForm, reminder: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                                            <label htmlFor={`edit-reminder-${act.id}`} className="text-sm text-gray-700 font-semibold">Reminder</label>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end mt-4">
                                        <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
                                        <button onClick={() => handleEdit(act.id)} disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow flex items-center gap-2 transition">
                                            {saving ? 'Saving...' : <><Save size={15} /> Update</>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Row */
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                            <AlarmClock size={18} className="text-indigo-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">{act.activity_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {act.start_time?.slice(0, 5)} – {act.end_time?.slice(0, 5)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${priorityColors[act.priority] || priorityColors.Medium}`}>
                                            {act.priority || 'Medium'}
                                        </span>
                                        {act.is_custom ? (
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full border bg-purple-100 text-purple-700 border-purple-200">Custom</span>
                                        ) : (
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full border bg-gray-100 text-gray-500 border-gray-200">Template</span>
                                        )}
                                        <button
                                            onClick={() => startEdit(act)}
                                            className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(act.id)}
                                            disabled={deleting === act.id}
                                            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition"
                                            title="Delete"
                                        >
                                            {deleting === act.id ? <span className="text-xs">...</span> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AnalyticsView() {
    const [metrics, setMetrics] = useState<any>(null);
    useEffect(() => {
        api.get('/dayplanner/analytics').then(res => setMetrics(res.data)).catch(() => { });
    }, []);

    if (!metrics) return <div>Loading Analytics...</div>;

    return (
        <div className="animate-fade-in max-w-3xl mx-auto py-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Today's Performance</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                    <div className="text-3xl font-extrabold text-green-600 mb-1">{metrics.completed}</div>
                    <div className="text-xs font-bold text-green-800 uppercase">Completed</div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 text-center">
                    <div className="text-3xl font-extrabold text-yellow-600 mb-1">{metrics.partial}</div>
                    <div className="text-xs font-bold text-yellow-800 uppercase">Partial</div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                    <div className="text-3xl font-extrabold text-red-600 mb-1">{metrics.missed}</div>
                    <div className="text-xs font-bold text-red-800 uppercase">Missed</div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center">
                    <div className="text-3xl font-extrabold text-indigo-600 mb-1">{metrics.average_rating} <span className="text-lg">⭐</span></div>
                    <div className="text-xs font-bold text-indigo-800 uppercase">Avg Rating</div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Completion Score</h3>
                <div className="relative w-48 h-48 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3" strokeDasharray={`${metrics.completion_percentage}, 100`} className="animate-pulse" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold text-indigo-600">{metrics.completion_percentage}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
