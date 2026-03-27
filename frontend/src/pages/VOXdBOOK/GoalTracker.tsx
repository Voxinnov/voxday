import React, { useState, useEffect } from 'react';
import {
    Target, Plus, CheckCircle2, Circle, Clock,
    BarChart3, Flag, Layers, Milestone,
    Award, TrendingUp, Calendar, BookOpen,
    ChevronRight, MoreVertical, AlertCircle, Quote
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface Milestone {
    id: number;
    title: string;
    is_completed: boolean;
    due_date: string;
}

interface Goal {
    id: number;
    title: string;
    description: string;
    category: string;
    type: string;
    priority: string;
    status: string;
    start_date: string;
    target_date: string;
    progress_percentage: number;
}

interface GoalDetail {
    goal: Goal;
    milestones: Milestone[];
    habits: any[];
    logs: any[];
}

const GoalTracker: React.FC = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<GoalDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'active' | 'completed'>('dashboard');
    const [detailTab, setDetailTab] = useState<'milestones' | 'habits' | 'logs'>('milestones');

    // Stats
    const stats = {
        total: goals.length,
        active: goals.filter(g => g.status === 'Active').length,
        completed: goals.filter(g => g.status === 'Completed').length,
        avgProgress: goals.length > 0 ? Math.round(goals.reduce((acc, curr) => acc + curr.progress_percentage, 0) / goals.length) : 0
    };

    const categories = ['Health & Fitness', 'Career', 'Finance', 'Education', 'Personal Development', 'Spiritual', 'Family', 'Business'];

    const [newGoal, setNewGoal] = useState({
        title: '', description: '', category: 'General', type: 'Short-term', priority: 'Medium',
        start_date: new Date().toISOString().split('T')[0],
        target_date: ''
    });

    const [editingGoal, setEditingGoal] = useState<any>(null);

    const [newMilestone, setNewMilestone] = useState({ title: '', due_date: '' });
    const [newHabit, setNewHabit] = useState({ title: '', frequency: 'Daily' });
    const [newLog, setNewLog] = useState({ content: '', log_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data.data);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load goals");
            setLoading(false);
        }
    };

    const fetchGoalDetail = async (id: number) => {
        try {
            const res = await api.get(`/goals/${id}`);
            setSelectedGoal(res.data.data);
        } catch (err) {
            toast.error("Failed to load details");
        }
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/goals', newGoal);
            toast.success("Goal Created!");
            setIsAddModalOpen(false);
            setNewGoal({
                title: '', description: '', category: 'General', type: 'Short-term', priority: 'Medium',
                start_date: new Date().toISOString().split('T')[0],
                target_date: ''
            });
            fetchGoals();
        } catch (err) {
            toast.error("Failed to create goal");
        }
    };

    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/goals/${editingGoal.id}`, editingGoal);
            toast.success("Goal Updated!");
            setIsEditModalOpen(false);
            if (selectedGoal?.goal.id === editingGoal.id) {
                fetchGoalDetail(editingGoal.id);
            }
            fetchGoals();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const updateStatus = async (status: string) => {
        if (!selectedGoal) return;
        try {
            const updated = { ...selectedGoal.goal, status };
            await api.put(`/goals/${selectedGoal.goal.id}`, updated);
            toast.success(`Status: ${status}`);
            fetchGoalDetail(selectedGoal.goal.id);
            fetchGoals();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDeleteGoal = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this goal?")) return;
        try {
            await api.delete(`/goals/${id}`);
            toast.success("Goal Deleted");
            setSelectedGoal(null);
            fetchGoals();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        const goalId = selectedGoal?.goal.id;
        if (!goalId) return;
        try {
            await api.post(`/goals/${goalId}/milestones`, newMilestone);
            toast.success("Milestone Added!");
            setIsMilestoneModalOpen(false);
            setNewMilestone({ title: '', due_date: '' });
            fetchGoalDetail(goalId);
            fetchGoals();
        } catch (err) {
            toast.error("Failed to add milestone");
        }
    };

    const handleDeleteMilestone = async (id: number) => {
        const goalId = selectedGoal?.goal.id;
        if (!goalId) return;
        try {
            await api.delete(`/goals/milestones/${id}`);
            toast.success("Milestone Deleted");
            fetchGoalDetail(goalId);
            fetchGoals();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const toggleMilestone = async (milestoneId: number) => {
        try {
            await api.put(`/goals/milestones/${milestoneId}`);
            toast.success("Progress Updated!");
            if (selectedGoal) {
                fetchGoalDetail(selectedGoal.goal.id);
            }
            fetchGoals();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        const goalId = selectedGoal?.goal.id;
        if (!goalId) return;
        try {
            await api.post(`/goals/${goalId}/habits`, newHabit);
            toast.success("Habit Integrated!");
            setIsHabitModalOpen(false);
            setNewHabit({ title: '', frequency: 'Daily' });
            fetchGoalDetail(goalId);
        } catch (err) {
            toast.error("Failed to add habit");
        }
    };

    const handleDeleteHabit = async (id: number) => {
        const goalId = selectedGoal?.goal.id;
        if (!goalId) return;
        try {
            await api.delete(`/goals/habits/${id}`);
            toast.success("Habit Removed");
            fetchGoalDetail(goalId);
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const goalId = selectedGoal?.goal.id;
        if (!goalId) return;
        try {
            await api.post(`/goals/${goalId}/logs`, newLog);
            toast.success("Log Entry Added!");
            setIsLogModalOpen(false);
            setNewLog({ content: '', log_date: new Date().toISOString().split('T')[0] });
            fetchGoalDetail(goalId);
        } catch (err) {
            toast.error("Failed to add log");
        }
    };

    const daysRemaining = (dateStr: string) => {
        if (!dateStr) return 0;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'text-red-600 bg-red-50 border-red-100';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Target className="text-indigo-600" size={36} />
                            Goal Tracker
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Turn your dreams into reality, one milestone at a time.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Create New Goal
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Goals', value: stats.total, icon: Target, color: 'text-slate-600', bg: 'bg-white' },
                        { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                        { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                        { label: 'Avg Progress', value: stats.avgProgress + '%', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50/50' }
                    ].map((s, i) => (
                        <div key={i} className={`p-6 rounded-3xl border border-slate-200/60 ${s.bg} shadow-sm backdrop-blur-sm`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-white shadow-sm ${s.color}`}>
                                    <s.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column (Goal List) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
                            {['dashboard', 'active', 'completed'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t as any)}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {goals.filter(g => {
                                if (activeTab === 'active') return g.status === 'Active';
                                if (activeTab === 'completed') return g.status === 'Completed';
                                return true;
                            }).map(goal => (
                                <div
                                    key={goal.id}
                                    onClick={() => fetchGoalDetail(goal.id)}
                                    className={`group bg-white rounded-3xl p-6 border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${selectedGoal?.goal.id === goal.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200/60'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getPriorityColor(goal.priority)}`}>
                                            {goal.priority} Priority
                                        </span>
                                        <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{goal.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 h-10">{goal.description || 'No description provided.'}</p>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end text-sm">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                <Clock size={16} />
                                                {daysRemaining(goal.target_date)} days left
                                            </div>
                                            <span className="text-indigo-600 font-black">{goal.progress_percentage}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                                style={{ width: `${goal.progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (Details) */}
                    <div className="lg:col-span-1">
                        {selectedGoal ? (
                            <div className="sticky top-8 bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-xl shadow-slate-200/50">
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                                <Target size={28} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 lowercase first-letter:uppercase">{selectedGoal?.goal.title}</h2>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-bold text-sm">{selectedGoal?.goal.category}</span>
                                                    <span className="text-slate-200">|</span>
                                                    <select
                                                        value={selectedGoal?.goal.status}
                                                        onChange={(e) => updateStatus(e.target.value)}
                                                        className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-transparent outline-none cursor-pointer hover:text-indigo-700 font-sans"
                                                    >
                                                        <option>Active</option>
                                                        <option>Completed</option>
                                                        <option>On-Hold</option>
                                                        <option>Abandoned</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    if (selectedGoal) {
                                                        setEditingGoal(selectedGoal.goal);
                                                        setIsEditModalOpen(true);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                            <button
                                                onClick={() => selectedGoal && handleDeleteGoal(selectedGoal.goal.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <AlertCircle size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 font-medium leading-relaxed mb-6">{selectedGoal.goal.description}</p>

                                    {/* Detail Tabs */}
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
                                        {['milestones', 'habits', 'logs'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setDetailTab(t as any)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-black capitalize transition-all ${detailTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div className="space-y-6 mb-8 min-h-[300px]">
                                    {detailTab === 'milestones' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-slate-900 font-black flex items-center gap-2">
                                                    <Milestone size={20} className="text-indigo-600" />
                                                    Milestones
                                                </h4>
                                                <button
                                                    onClick={() => setIsMilestoneModalOpen(true)}
                                                    className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedGoal.milestones.map((m: any) => (
                                                    <div
                                                        key={m.id}
                                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${m.is_completed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100 hover:border-indigo-300'}`}
                                                    >
                                                        <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleMilestone(m.id)}>
                                                            {m.is_completed ? (
                                                                <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                                                            ) : (
                                                                <Circle className="text-slate-300 shrink-0" size={22} />
                                                            )}
                                                            <span className={`font-bold text-sm ${m.is_completed ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'}`}>
                                                                {m.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteMilestone(m.id)}
                                                            className="text-slate-300 hover:text-red-500 ml-2"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                {selectedGoal.milestones.length === 0 && (
                                                    <p className="text-center py-8 text-slate-400 text-sm font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                        No milestones added yet.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'habits' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-slate-900 font-black flex items-center gap-2">
                                                    <Layers size={20} className="text-indigo-600" />
                                                    Integrated Habits
                                                </h4>
                                                <button
                                                    onClick={() => setIsHabitModalOpen(true)}
                                                    className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedGoal.habits.map((h: any) => (
                                                    <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                        <div>
                                                            <p className="font-bold text-slate-700 text-sm">{h.title}</p>
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{h.frequency}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteHabit(h.id)}
                                                            className="text-slate-300 hover:text-red-500"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                {selectedGoal.habits.length === 0 && (
                                                    <p className="text-center py-8 text-slate-400 text-sm font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                        Add daily actions to build consistency.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {detailTab === 'logs' && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-slate-900 font-black flex items-center gap-2">
                                                    <BookOpen size={20} className="text-indigo-600" />
                                                    Progress Logs
                                                </h4>
                                                <button
                                                    onClick={() => setIsLogModalOpen(true)}
                                                    className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                {selectedGoal.logs.map((l: any) => (
                                                    <div key={l.id} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-200 before:rounded-full">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(l.log_date).toLocaleDateString()}</p>
                                                        <p className="text-sm font-medium text-slate-600">{l.content}</p>
                                                    </div>
                                                ))}
                                                {selectedGoal.logs.length === 0 && (
                                                    <p className="text-center py-8 text-slate-400 text-sm font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                        Record your thoughts and wins.
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Motivation / Quote */}
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative group">
                                    <Quote size={80} className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors" />
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={16} className="text-indigo-400" />
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Daily Motivation</p>
                                    </div>
                                    <p className="font-bold leading-relaxed italic relative z-10 text-slate-100">
                                        "The future depends on what you do today."
                                    </p>
                                    <p className="text-sm font-medium mt-4 text-white/50">- Mahatma Gandhi</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                                <Award size={64} className="text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-900 mb-2">Goal Details</h3>
                                <p className="text-slate-400 font-medium">Select a goal from the list to view its progress, milestones, and daily logs.</p>
                                {loading && <div className="mt-4 text-indigo-600 animate-pulse font-bold">Syncing dreams...</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals Container */}
            <div className="z-[100]">
                {/* Create Goal Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <Flag className="text-indigo-600" size={24} />
                                    <h2 className="text-2xl font-black text-slate-900">Define New Goal</h2>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
                            </div>
                            <form onSubmit={handleCreateGoal} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Goal Title</label>
                                    <input
                                        type="text" required placeholder="e.g. Master React in 30 days"
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold focus:border-indigo-500 transition-all font-sans"
                                        value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                        <select
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold appearance-none font-sans"
                                            value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                                        >
                                            {categories.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                                        <select
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold appearance-none font-sans"
                                            value={newGoal.priority} onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
                                        >
                                            <option>Low</option><option>Medium</option><option>High</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                                        <input
                                            type="date" required
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold font-sans"
                                            value={newGoal.start_date} onChange={e => setNewGoal({ ...newGoal, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Date</label>
                                        <input
                                            type="date" required
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold font-sans"
                                            value={newGoal.target_date} onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold resize-none font-sans"
                                        value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                    />
                                </div>
                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all">
                                    Launch Goal
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Goal Modal */}
                {isEditModalOpen && editingGoal && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-2xl font-black text-slate-900">Edit Goal</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
                            </div>
                            <form onSubmit={handleUpdateGoal} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Goal Title</label>
                                    <input
                                        type="text" required
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold font-sans"
                                        value={editingGoal.title} onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                        <select
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold appearance-none font-sans"
                                            value={editingGoal.category} onChange={e => setEditingGoal({ ...editingGoal, category: e.target.value })}
                                        >
                                            {categories.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Date</label>
                                        <input
                                            type="date" required
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold font-sans"
                                            value={editingGoal.target_date?.split('T')[0]}
                                            onChange={e => setEditingGoal({ ...editingGoal, target_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold resize-none font-sans"
                                        value={editingGoal.description} onChange={e => setEditingGoal({ ...editingGoal, description: e.target.value })}
                                    />
                                </div>
                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                                    <Calendar size={20} />
                                    Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Milestone Modal */}
                {isMilestoneModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMilestoneModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-black text-slate-900">Add Milestone</h2>
                                <button onClick={() => setIsMilestoneModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
                            </div>
                            <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                                    <input
                                        type="text" required placeholder="e.g. Complete Phase 1"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold font-sans"
                                        value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold font-sans"
                                        value={newMilestone.due_date} onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                                    />
                                </div>
                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black transition-all">
                                    Add Milestone
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Habit Modal */}
                {isHabitModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHabitModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-black text-slate-900">Integrate Habit</h2>
                                <button onClick={() => setIsHabitModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
                            </div>
                            <form onSubmit={handleAddHabit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Action / Habit</label>
                                    <input
                                        type="text" required placeholder="e.g. Read for 30 minutes"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold font-sans"
                                        value={newHabit.title} onChange={e => setNewHabit({ ...newHabit, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Frequency</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold appearance-none font-sans"
                                        value={newHabit.frequency} onChange={e => setNewHabit({ ...newHabit, frequency: e.target.value })}
                                    >
                                        <option>Daily</option><option>Weekly</option><option>Weekdays</option>
                                    </select>
                                </div>
                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black transition-all">
                                    Integrate
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Log Modal */}
                {isLogModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLogModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-black text-slate-900">Add Progress Log</h2>
                                <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-bold">×</button>
                            </div>
                            <form onSubmit={handleAddLog} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">What happened today?</label>
                                    <textarea
                                        rows={4} required placeholder="Record your progress, setbacks, or lessons learned..."
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold resize-none font-sans"
                                        value={newLog.content} onChange={e => setNewLog({ ...newLog, content: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Log Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border outline-none font-bold font-sans"
                                        value={newLog.log_date} onChange={e => setNewLog({ ...newLog, log_date: e.target.value })}
                                    />
                                </div>
                                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black transition-all">
                                    Add Entry
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoalTracker;
