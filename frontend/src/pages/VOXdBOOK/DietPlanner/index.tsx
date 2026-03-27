import React, { useState, useEffect } from 'react';
import { User, Calculator, Database, Calendar, Printer, Activity, Utensils } from 'lucide-react';
import api from '../../../services/smartApi';
import toast from 'react-hot-toast';

export default function DietPlanner() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen pb-20">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Utensils className="text-indigo-600" size={32} />
                        Diet Planner
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Personalized nutrition and meal tracking</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm text-sm font-semibold transition-all">
                        <Printer size={16} /> Print View
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
                <TabButton icon={<Calendar size={18} />} label="My Plan" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <TabButton icon={<User size={18} />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <TabButton icon={<Calculator size={18} />} label="BMI Calc" active={activeTab === 'bmi'} onClick={() => setActiveTab('bmi')} />
                <TabButton icon={<Activity size={18} />} label="Generator" active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
                <TabButton icon={<Database size={18} />} label="Foods DB" active={activeTab === 'foods'} onClick={() => setActiveTab('foods')} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'profile' && <ProfileView />}
                {activeTab === 'bmi' && <BMIView />}
                {activeTab === 'generator' && <GeneratorView setTab={setActiveTab} />}
                {activeTab === 'foods' && <FoodsView />}
            </div>
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

function DashboardView() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const res = await api.get('/mealplan/me');
            setData(res.data);
        } catch (error) {
            toast.error('Failed to load meal plan');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading your plan...</div>;
    if (!data) return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <Utensils size={64} className="text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Meal Plan Found</h2>
            <p className="text-gray-500 mb-6">Generate your personalized diet plan based on BMI or direct goals.</p>
        </div>
    );

    const { plan, items } = data;

    // Group by day
    const days: Record<number, any[]> = {};
    items.forEach((it: any) => {
        if (!days[it.day_number]) days[it.day_number] = [];
        days[it.day_number].push(it);
    });

    return (
        <div className="printable-area animate-fade-in">
            <div className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-indigo-900 mb-1">Your {plan.duration}-Day Diet Plan</h2>
                    <p className="text-indigo-700 text-sm font-medium">Goal: {plan.goal} • Plan Type: {plan.plan_type}</p>
                </div>
                <div className="text-right">
                    <span className="bg-white text-indigo-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm whitespace-nowrap">
                        Base BMI: {plan.bmi}
                    </span>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(days).map((dayNum) => {
                    const dayItems = days[parseInt(dayNum)];
                    const totalCal = dayItems.reduce((acc: number, it: any) => acc + Number(it.calories || 0), 0);
                    const totalPro = dayItems.reduce((acc: number, it: any) => acc + Number(it.protein || 0), 0);

                    return (
                        <div key={dayNum} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 text-lg">Day {dayNum}</h3>
                                <div className="flex gap-4 text-sm font-semibold">
                                    <span className="text-orange-600">{totalCal.toFixed(0)} kcal</span>
                                    <span className="text-blue-600">{totalPro.toFixed(1)}g Protein</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dayItems.map((meal: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors shadow-sm">
                                            <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">
                                                {meal.meal_type}
                                            </div>
                                            <div className="font-semibold text-gray-800 mb-1">{meal.food_name || 'Rest / Fasting'}</div>
                                            <div className="text-xs text-gray-500 flex justify-between mt-3 bg-gray-50 p-2 rounded">
                                                <span>Cal: {meal.calories}</span>
                                                <span>Pro: {meal.protein}g</span>
                                                <span>Carb: {meal.carbs}g</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ProfileView() {
    const [profile, setProfile] = useState({
        age: '', gender: 'Male', height_cm: '', weight_kg: '', activity_level: 'Light Activity', food_preference: 'Vegetarian', region: 'Indian'
    });

    useEffect(() => {
        api.get('/profile/me').then(res => {
            if (res.data) setProfile(res.data);
        }).catch(() => { });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/profile/create', profile);
            toast.success('Profile saved!');
        } catch (err) {
            toast.error('Error saving profile');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-4 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Your Health Profile</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })}>
                            <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Height (cm)</label>
                        <input type="number" step="0.1" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={profile.height_cm} onChange={e => setProfile({ ...profile, height_cm: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
                        <input type="number" step="0.1" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={profile.weight_kg} onChange={e => setProfile({ ...profile, weight_kg: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Activity Level</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={profile.activity_level} onChange={e => setProfile({ ...profile, activity_level: e.target.value })}>
                            <option>Sedentary</option><option>Light Activity</option><option>Moderate Activity</option><option>Heavy Activity</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Food Preference</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={profile.food_preference} onChange={e => setProfile({ ...profile, food_preference: e.target.value })}>
                            <option>Vegetarian</option><option>Non-Vegetarian</option><option>Vegan</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Region</label>
                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg" value={profile.region} onChange={e => setProfile({ ...profile, region: e.target.value })}>
                            <option>Indian</option><option>Kerala</option><option>International</option>
                        </select>
                    </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">Save Health Profile</button>
            </form>
        </div>
    );
}

function BMIView() {
    const [data, setData] = useState({ height_cm: '', weight_kg: '' });
    const [result, setResult] = useState<any>(null);

    const calc = async () => {
        try {
            const res = await api.post('/bmi/calculate', data);
            setResult(res.data);
        } catch (err) {
            toast.error('Error calculating BMI');
        }
    };

    return (
        <div className="max-w-md mx-auto py-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">BMI Calculator</h2>
            <div className="space-y-4 text-left">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Height (cm)</label>
                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={data.height_cm} onChange={e => setData({ ...data, height_cm: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (kg)</label>
                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={data.weight_kg} onChange={e => setData({ ...data, weight_kg: e.target.value })} />
                </div>
                <button onClick={calc} className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">Calculate</button>
            </div>
            {result && (
                <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="text-5xl font-extrabold text-indigo-600 mb-2">{result.bmi}</div>
                    <div className="text-lg font-bold text-gray-800 mb-4">Category: {result.category}</div>
                    <p className="text-sm text-indigo-800">Recommended Diet Goal: <strong>{result.recommended_goal}</strong></p>
                </div>
            )}
        </div>
    );
}

function GeneratorView({ setTab }: { setTab: any }) {
    const [form, setForm] = useState({ goal: 'Weight Loss', plan_type: 'NON_BMI', duration: 7 });
    const [loading, setLoading] = useState(false);

    const gen = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/mealplan/generate', form);
            toast.success('Meal plan successfully generated!');
            setTab('dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error generating plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-6 animate-fade-in">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Smart Diet Plan</h2>
                <p className="text-gray-500">Create randomized, calibrated meals based on your profile.</p>
            </div>

            <form onSubmit={gen} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Generation Basis</label>
                    <select className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={form.plan_type} onChange={e => setForm({ ...form, plan_type: e.target.value })}>
                        <option value="NON_BMI">Generic / Standard Goal</option>
                        <option value="BMI">Based solely on my Profile BMI</option>
                    </select>
                </div>

                {form.plan_type === 'NON_BMI' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Goal</label>
                        <select className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                            <option>Weight Loss</option>
                            <option>Weight Gain</option>
                            <option>Maintenance</option>
                            <option>Fitness</option>
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Duration</label>
                    <select className="w-full p-3 bg-white border border-gray-200 rounded-xl" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}>
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                    </select>
                </div>

                <button type="submit" disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition flex justify-center items-center gap-2 disabled:opacity-50">
                    {loading ? 'Generating...' : <><Calendar size={18} /> Generate Plan Now</>}
                </button>
            </form>
        </div>
    );
}

function FoodsView() {
    const [foods, setFoods] = useState([]);
    useEffect(() => {
        api.get('/foods').then(res => setFoods(res.data)).catch(() => { });
    }, []);

    return (
        <div className="animate-fade-in pb-10">
            <header className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Food Database Management</h2>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{foods.length} items</span>
            </header>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4">Food Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Nutrients (Cal/Pro/Carb/Fat)</th>
                            <th className="px-6 py-4">Diet Type</th>
                            <th className="px-6 py-4">Region</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {foods.map((f: any) => (
                            <tr key={f.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-semibold text-gray-900">{f.food_name}</td>
                                <td className="px-6 py-4 text-indigo-600 font-medium">
                                    {f.category?.replace(/_/g, ' ')}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <span className="text-orange-600 font-medium">{f.calories}</span> / {f.protein} / {f.carbs} / {f.fat}
                                </td>
                                <td className="px-6 py-4 uppercase text-xs">{f.diet_type?.replace(/_/g, ' ')}</td>
                                <td className="px-6 py-4">{f.region || 'Indian'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
