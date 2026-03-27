import React, { useState, useEffect } from 'react';
import { Car, Plus, Settings, Fuel as FuelIcon, Receipt, Shield, Phone, Truck, AlertTriangle } from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';

interface Vehicle {
    id: number;
    name: string;
    number: string;
    type: string;
    brand: string;
    model: string;
    year: number;
    fuel_type: string;
    insurance_expiry: string;
    rc_expiry: string;
    pollution_expiry: string;
    purchase_date: string;
    current_odometer: number;
}

const VehicleManagement: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
    const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

    // Forms
    const [vehicleForm, setVehicleForm] = useState({
        name: '', number: '', type: 'Car', brand: '', model: '', year: new Date().getFullYear(),
        fuel_type: 'Petrol', insurance_expiry: '', rc_expiry: '', pollution_expiry: '', purchase_date: '', current_odometer: ''
    });

    const [serviceForm, setServiceForm] = useState({
        service_date: new Date().toISOString().split('T')[0], odometer: '', service_type: 'General Service',
        garage_name: '', cost: '', description: '', next_service_odometer: ''
    });

    const [fuelForm, setFuelForm] = useState({
        date: new Date().toISOString().split('T')[0], odometer: '', quantity: '', cost: ''
    });

    const [expenseForm, setExpenseForm] = useState({
        date: new Date().toISOString().split('T')[0], expense_type: 'Repair', amount: '', description: ''
    });

    const [vehicleDetails, setVehicleDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (activeVehicle) {
            fetchVehicleDetails(activeVehicle.id);
        }
    }, [activeVehicle]);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles');
            setVehicles(res.data.data);
            if (res.data.data.length > 0 && !activeVehicle) {
                setActiveVehicle(res.data.data[0]);
            }
        } catch (error) {
            console.error('Error fetching vehicles', error);
        }
    };

    const fetchVehicleDetails = async (id: number) => {
        setLoadingDetails(true);
        try {
            const res = await api.get(`/vehicles/${id}`);
            setVehicleDetails(res.data.data);
        } catch (error) {
            console.error('Error fetching details', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCreateVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/vehicles', {
                ...vehicleForm,
                current_odometer: Number(vehicleForm.current_odometer)
            });
            toast.success("Vehicle Added Successfully!");
            setIsAddVehicleOpen(false);
            fetchVehicles();
        } catch (err) {
            toast.error("Failed to add vehicle");
        }
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVehicle) return;
        try {
            await api.post(`/vehicles/${activeVehicle.id}/services`, {
                ...serviceForm,
                odometer: Number(serviceForm.odometer),
                cost: Number(serviceForm.cost),
                next_service_odometer: Number(serviceForm.next_service_odometer)
            });
            toast.success("Service Logged!");
            setIsAddServiceOpen(false);
            fetchVehicleDetails(activeVehicle.id);
        } catch (err) {
            toast.error("Failed to log service");
        }
    };

    const handleCreateFuel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVehicle) return;
        try {
            await api.post(`/vehicles/${activeVehicle.id}/fuels`, {
                ...fuelForm,
                odometer: Number(fuelForm.odometer),
                quantity: Number(fuelForm.quantity),
                cost: Number(fuelForm.cost)
            });
            toast.success("Fuel Added!");
            setIsAddFuelOpen(false);
            fetchVehicleDetails(activeVehicle.id);
            fetchVehicles(); // update sidebar/header odo
        } catch (err) {
            toast.error("Failed to add fuel");
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVehicle) return;
        try {
            await api.post(`/vehicles/${activeVehicle.id}/expenses`, {
                ...expenseForm,
                amount: Number(expenseForm.amount)
            });
            toast.success("Expense Recorded!");
            setIsAddExpenseOpen(false);
            fetchVehicleDetails(activeVehicle.id);
        } catch (err) {
            toast.error("Failed to record expense");
        }
    };

    // Calculate Dashboard numbers based on vehicleDetails
    const calcThisMonthExpenses = () => {
        if (!vehicleDetails || !vehicleDetails.expenses) return 0;
        const currentMonth = new Date().getMonth();
        return vehicleDetails.expenses.reduce((acc: number, curr: any) => {
            if (new Date(curr.date).getMonth() === currentMonth) {
                return acc + Number(curr.amount);
            }
            return acc;
        }, 0);
    };

    const calcNextServiceDistance = () => {
        if (!vehicleDetails || !vehicleDetails.services || vehicleDetails.services.length === 0) return 0;
        const lastService = vehicleDetails.services[0];
        const nextOdo = lastService.next_service_odometer || 0;
        const current = vehicleDetails.vehicle.current_odometer;
        return Math.max(0, nextOdo - current);
    };

    const daysUntil = (dateStr: string) => {
        if (!dateStr) return 0;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar List of Vehicles */}
            <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full md:min-h-screen">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Car className="text-indigo-600" />
                        Garage
                    </h1>
                    <button
                        onClick={() => setIsAddVehicleOpen(true)}
                        className="mt-4 w-full bg-indigo-50 text-indigo-600 py-2.5 rounded-lg font-medium hover:bg-indigo-100 flex justify-center items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Add New Vehicle
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {vehicles.length === 0 && (
                        <div className="text-center text-gray-500 py-10 opacity-70">
                            <Truck size={40} className="mx-auto mb-3 opacity-50" />
                            <p>No vehicles in your garage</p>
                        </div>
                    )}
                    {vehicles.map(v => (
                        <div
                            key={v.id}
                            onClick={() => setActiveVehicle(v)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${activeVehicle?.id === v.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-indigo-300'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold">{v.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-md bg-white/20 ${activeVehicle?.id !== v.id && 'bg-gray-100 text-gray-600'}`}>{v.type}</span>
                            </div>
                            <p className={`text-sm tracking-wider font-medium ${activeVehicle?.id === v.id ? 'text-indigo-100' : 'text-gray-500'}`}>{v.number}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeVehicle ? (
                    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
                        {/* Header Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-1">{activeVehicle.brand} {activeVehicle.model}</h2>
                                <p className="text-gray-500 font-medium tracking-wide flex items-center gap-2">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{activeVehicle.number}</span> • {activeVehicle.year} • {activeVehicle.fuel_type}
                                </p>
                            </div>
                            <div className="flex gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-[200px]">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Settings className="text-gray-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Odometer</p>
                                    <p className="font-bold text-gray-900">{activeVehicle.current_odometer.toLocaleString()} km</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar gap-2 sm:gap-6">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: Settings },
                                { id: 'services', label: 'Services', icon: Shield },
                                { id: 'fuel', label: 'Fuel Logs', icon: FuelIcon },
                                { id: 'expenses', label: 'Expenses', icon: Receipt },
                                { id: 'documents', label: 'Documents', icon: Shield },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-4 px-2 sm:px-4 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {loadingDetails ? (
                            <div className="py-20 text-center text-gray-400 font-medium">Loading vehicle records...</div>
                        ) : (
                            <div>
                                {activeTab === 'dashboard' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Next Service</h4>
                                                <p className="text-2xl font-bold text-gray-900">{calcNextServiceDistance()} <span className="text-sm font-normal text-gray-500">km rem</span></p>
                                            </div>
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Insurance Exp.</h4>
                                                <p className="text-2xl font-bold text-gray-900">{daysUntil(activeVehicle.insurance_expiry)} <span className="text-sm font-normal text-gray-500">days left</span></p>
                                            </div>
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Avg. Mileage</h4>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {vehicleDetails?.fuels?.filter((f: any) => f.calculated_mileage).length > 0
                                                        ? Number(vehicleDetails.fuels.filter((f: any) => f.calculated_mileage)[0].calculated_mileage).toFixed(1)
                                                        : '--'} <span className="text-sm font-normal text-gray-500">km/l</span></p>
                                            </div>
                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Expenses (Month)</h4>
                                                <p className="text-2xl font-bold text-gray-900">₹{calcThisMonthExpenses().toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Important Alerts</h3>
                                                <ul className="space-y-4">
                                                    {daysUntil(activeVehicle.pollution_expiry) <= 30 && (
                                                        <li className="flex items-start gap-3 text-sm">
                                                            <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500"></div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">Pollution Certificate Expires Soon</p>
                                                                <p className="text-gray-500">Expires in {daysUntil(activeVehicle.pollution_expiry)} days</p>
                                                            </div>
                                                        </li>
                                                    )}
                                                    {calcNextServiceDistance() < 1000 && (
                                                        <li className="flex items-start gap-3 text-sm">
                                                            <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">Service Due Imminently</p>
                                                                <p className="text-gray-500">Your next service is due in {calcNextServiceDistance()} km.</p>
                                                            </div>
                                                        </li>
                                                    )}
                                                    {daysUntil(activeVehicle.pollution_expiry) > 30 && calcNextServiceDistance() >= 1000 && (
                                                        <li className="text-emerald-600 font-medium text-sm flex items-center gap-2 bg-emerald-50 p-3 rounded-lg"><Shield size={16} /> All systems clear. No immediate action required.</li>
                                                    )}
                                                </ul>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Phone size={18} className="text-indigo-500" /> Emergency Contacts</h3>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="font-semibold text-gray-800 text-sm">Roadside Assistance</span>
                                                        <span className="text-indigo-600 font-mono text-sm">1800-103-1234</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="font-semibold text-gray-800 text-sm">Insurance Helpline</span>
                                                        <span className="text-indigo-600 font-mono text-sm">1800-220-4567</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="font-semibold text-gray-800 text-sm">My Mechanic</span>
                                                        <span className="text-indigo-600 font-mono text-sm">+91 98765 43210</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'services' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-900">Service History</h3>
                                            <button onClick={() => setIsAddServiceOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Plus size={16} /> Log Service</button>
                                        </div>
                                        <div className="p-0">
                                            {vehicleDetails?.services?.length > 0 ? (
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider">
                                                        <tr>
                                                            <th className="p-4">Date</th>
                                                            <th className="p-4">Odometer</th>
                                                            <th className="p-4">Service Type</th>
                                                            <th className="p-4">Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {vehicleDetails.services.map((s: any) => (
                                                            <tr key={s.id} className="hover:bg-gray-50">
                                                                <td className="p-4 font-medium text-gray-900">{new Date(s.service_date).toLocaleDateString()}</td>
                                                                <td className="p-4 text-gray-600">{s.odometer} km</td>
                                                                <td className="p-4 text-gray-600">{s.service_type}</td>
                                                                <td className="p-4 font-semibold text-gray-900">₹{s.cost}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-10 text-center text-gray-500">No service history found.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'fuel' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-900">Fuel Log</h3>
                                            <button onClick={() => setIsAddFuelOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Plus size={16} /> Add Fuel</button>
                                        </div>
                                        <div className="p-0">
                                            {vehicleDetails?.fuels?.length > 0 ? (
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider">
                                                        <tr>
                                                            <th className="p-4">Date</th>
                                                            <th className="p-4">Quantity</th>
                                                            <th className="p-4">Cost</th>
                                                            <th className="p-4">Mileage</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {vehicleDetails.fuels.map((f: any) => (
                                                            <tr key={f.id} className="hover:bg-gray-50">
                                                                <td className="p-4 font-medium text-gray-900">{new Date(f.date).toLocaleDateString()}</td>
                                                                <td className="p-4 text-gray-600">{f.quantity} L</td>
                                                                <td className="p-4 font-semibold text-gray-900">₹{f.cost}</td>
                                                                <td className="p-4 text-indigo-600 font-semibold">{f.calculated_mileage ? `${Number(f.calculated_mileage).toFixed(1)} km/l` : '--'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-10 text-center text-gray-500">No fuel records found.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'expenses' && (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-900">Expense Tracker</h3>
                                            <button onClick={() => setIsAddExpenseOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Plus size={16} /> Add Expense</button>
                                        </div>
                                        <div className="p-0">
                                            {vehicleDetails?.expenses?.length > 0 ? (
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider">
                                                        <tr>
                                                            <th className="p-4">Date</th>
                                                            <th className="p-4">Expense Type</th>
                                                            <th className="p-4">Amount</th>
                                                            <th className="p-4">Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {vehicleDetails.expenses.map((e: any) => (
                                                            <tr key={e.id} className="hover:bg-gray-50">
                                                                <td className="p-4 font-medium text-gray-900">{new Date(e.date).toLocaleDateString()}</td>
                                                                <td className="p-4 text-gray-600">{e.expense_type}</td>
                                                                <td className="p-4 font-semibold text-red-600">- ₹{e.amount}</td>
                                                                <td className="p-4 text-gray-500">{e.description}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-10 text-center text-gray-500">No expenses recorded yet.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[
                                            { title: 'RC Copy', type: 'Registration' },
                                            { title: 'Insurance Policy', type: 'Insurance' },
                                            { title: 'Pollution Certificate', type: 'Pollution' },
                                            { title: 'Driving License', type: 'License' }
                                        ].map(doc => (
                                            <div key={doc.type} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-300 transition-all">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                                                    <Shield size={32} className="text-gray-300 group-hover:text-indigo-400" />
                                                </div>
                                                <h4 className="font-bold text-gray-900 mb-1">{doc.title}</h4>
                                                <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Empty Slot</p>
                                                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2">
                                                    <Plus size={16} /> Upload Now
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex w-full h-full items-center justify-center min-h-[50vh]">
                        <div className="text-center text-gray-400">
                            <Car size={64} className="mx-auto mb-4 opacity-20" />
                            <h2 className="text-2xl font-bold text-gray-600 mb-2">Welcome to your Garage</h2>
                            <p>Select a vehicle from the sidebar or add a new one.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Vehicle Modal */}
            {isAddVehicleOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddVehicleOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add New Vehicle</h2>
                            <button onClick={() => setIsAddVehicleOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="add-vehicle-form" onSubmit={handleCreateVehicle} className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Name</label>
                                        <input type="text" placeholder="e.g. My Daily Car" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Vehicle Number</label>
                                        <input type="text" placeholder="e.g. KL 11 AB 1234" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                            value={vehicleForm.number} onChange={e => setVehicleForm({ ...vehicleForm, number: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                                        <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.type} onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value })}>
                                            <option>Car</option><option>Bike</option><option>Scooter</option><option>Truck</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
                                        <input type="text" placeholder="e.g. Honda" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.brand} onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Model</label>
                                        <input type="text" placeholder="e.g. City" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <hr className="my-2 border-gray-100" />
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Odometer (km)</label>
                                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={vehicleForm.current_odometer} onChange={e => setVehicleForm({ ...vehicleForm, current_odometer: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Insurance Expiry Date</label>
                                        <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={vehicleForm.insurance_expiry} onChange={e => setVehicleForm({ ...vehicleForm, insurance_expiry: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">RC Expiry Date</label>
                                        <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={vehicleForm.rc_expiry} onChange={e => setVehicleForm({ ...vehicleForm, rc_expiry: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Pollution Certificate Expiry</label>
                                        <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={vehicleForm.pollution_expiry} onChange={e => setVehicleForm({ ...vehicleForm, pollution_expiry: e.target.value })} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase Date</label>
                                        <input type="date" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={vehicleForm.purchase_date} onChange={e => setVehicleForm({ ...vehicleForm, purchase_date: e.target.value })} />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsAddVehicleOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" form="add-vehicle-form" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Save Vehicle</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Service Modal */}
            {isAddServiceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddServiceOpen(false)} />
                    <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Log Service</h2>
                            <button onClick={() => setIsAddServiceOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6">
                            <form id="add-service-form" onSubmit={handleCreateService} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Service Date</label>
                                        <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={serviceForm.service_date} onChange={e => setServiceForm({ ...serviceForm, service_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Odometer (km)</label>
                                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={serviceForm.odometer} onChange={e => setServiceForm({ ...serviceForm, odometer: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Service Type</label>
                                        <input type="text" placeholder="e.g. Oil Change" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={serviceForm.service_type} onChange={e => setServiceForm({ ...serviceForm, service_type: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Cost (₹)</label>
                                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={serviceForm.cost} onChange={e => setServiceForm({ ...serviceForm, cost: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Garage Name</label>
                                    <input type="text" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={serviceForm.garage_name} onChange={e => setServiceForm({ ...serviceForm, garage_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Next Service Odometer (km)</label>
                                    <input type="number" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={serviceForm.next_service_odometer} onChange={e => setServiceForm({ ...serviceForm, next_service_odometer: e.target.value })} />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsAddServiceOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold rounded-xl">Cancel</button>
                            <button type="submit" form="add-service-form" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">Save Service</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Fuel Modal */}
            {isAddFuelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddFuelOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Add Fuel Record</h2>
                            <button onClick={() => setIsAddFuelOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6">
                            <form id="add-fuel-form" onSubmit={handleCreateFuel} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                    <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Odometer (km)</label>
                                    <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={fuelForm.odometer} onChange={e => setFuelForm({ ...fuelForm, odometer: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity (Liters)</label>
                                        <input type="number" step="0.01" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={fuelForm.quantity} onChange={e => setFuelForm({ ...fuelForm, quantity: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Total Cost (₹)</label>
                                        <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                            value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsAddFuelOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold rounded-xl">Cancel</button>
                            <button type="submit" form="add-fuel-form" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">Save Fuel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {isAddExpenseOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddExpenseOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Record Other Expense</h2>
                            <button onClick={() => setIsAddExpenseOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="p-6">
                            <form id="add-expense-form" onSubmit={handleCreateExpense} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                    <input type="date" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expense Type</label>
                                    <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={expenseForm.expense_type} onChange={e => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}>
                                        <option>Repair</option><option>Toll</option><option>Parking</option><option>Accessories</option><option>Insurance Premium</option><option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                                    <input type="number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <input type="text" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsAddExpenseOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold rounded-xl">Cancel</button>
                            <button type="submit" form="add-expense-form" className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-sm">Save Expense</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleManagement;
