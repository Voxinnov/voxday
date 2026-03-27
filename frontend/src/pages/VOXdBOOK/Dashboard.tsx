import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowRight
} from 'lucide-react';
import api from '../../services/smartApi';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  classification: 'personal' | 'official';
  amount: number | string;
  description: string;
  category_name?: string;
  transaction_date: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string;
}

interface DashboardData {
  transactions: Transaction[];
  tasks: Task[];
  loading: boolean;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    transactions: [],
    tasks: [],
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [txRes, taskRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/tasks')
      ]);
      setData({
        transactions: txRes.data,
        tasks: taskRes.data,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const getStats = () => {
    const income = data.transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = data.transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const pendingTasks = data.tasks.filter(t => t.status !== 'completed').length;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      pendingTasks
    };
  };

  const stats = getStats();
  const recentTransactions = data.transactions.slice(0, 5);
  const upcomingTasks = data.tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  if (data.loading) {
    return <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome back! Here's your financial and task summary.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Income</span>
            <h2 className="text-xl font-bold text-gray-900">₹{stats.totalIncome.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Expense</span>
            <h2 className="text-xl font-bold text-gray-900">₹{stats.totalExpense.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance</span>
            <h2 className="text-xl font-bold text-gray-900">₹{stats.balance.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Tasks</span>
            <h2 className="text-xl font-bold text-gray-900">{stats.pendingTasks}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Budget Health</h3>
            <span className="text-sm text-gray-500">{stats.totalIncome > 0 ? Math.round((stats.totalExpense / stats.totalIncome) * 100) : 0}% used</span>
          </div>

          <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{
                width: stats.totalIncome > 0
                  ? `${Math.min((stats.totalExpense / stats.totalIncome) * 100, 100)}%`
                  : stats.totalExpense > 0 ? '100%' : '0%'
              }}
            ></div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Transactions</h4>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-gray-400 text-sm py-2">No recent transactions</p>
              ) : recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                  <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">{tx.description}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${tx.classification === 'personal' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                      {tx.classification}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Priority Tasks</h3>
            <ArrowRight size={18} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending tasks</p>
            ) : upcomingTasks.map(task => (
              <div key={task.id} className="flex gap-4 items-start p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                <div className={`w-1 h-10 rounded-full mt-1 ${task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-indigo-500' : 'bg-green-500'
                  }`}></div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                  <p className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 px-4 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
