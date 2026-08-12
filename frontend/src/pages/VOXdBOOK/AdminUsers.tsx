import React, { useState, useEffect } from 'react';
import {
  Users, Shield, ShieldOff, Trash2, Search, RefreshCw,
  UserCheck, UserX, UserMinus, ChevronDown, ArrowUpRight,
  Wallet, Crown, User as UserIcon, Phone, Mail,
  Calendar, TrendingUp, TrendingDown
} from 'lucide-react';
import api from '../../services/smartApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

type UserRole = 'user' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  transaction_count: number;
  total_income: number;
  total_expense: number;
  payment_accounts_count: number;
}

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    icon: <UserCheck size={13} />,
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: <UserMinus size={13} />,
  },
  suspended: {
    label: 'Suspended',
    color: 'text-red-700',
    bg: 'bg-red-100',
    icon: <UserX size={13} />,
  },
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, status: UserStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status });
      toast.success(`User status set to ${status}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch {
      toast.error('Failed to update status');
    }
    setActiveDropdown(null);
  };

  const handleRoleChange = async (userId: number, role: UserRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success(`User role updated to ${role}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  // Summary counts
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" /> User Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all users, roles and account status</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all shadow-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: totalUsers, icon: <Users size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: activeCount, icon: <UserCheck size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Admins', value: adminCount, icon: <Crown size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Suspended', value: suspendedCount, icon: <UserX size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <span className={card.color}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as any)}
          className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : filtered.map(user => {
                const statusMeta = STATUS_META[user.status || 'active'];
                const isCurrentUser = currentUser && user.email === currentUser.email;
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-indigo-50/40' : ''}`}>
                    {/* User Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded">YOU</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={11} className="text-gray-400" /> {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={11} className="text-gray-400" /> {user.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role === 'admin' ? <Crown size={11} /> : <UserIcon size={11} />}
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            className={`p-1 rounded text-gray-300 hover:text-amber-500 transition-colors`}
                            title={user.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                          >
                            {user.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${statusMeta.bg} ${statusMeta.color} hover:opacity-80`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                          {!isCurrentUser && <ChevronDown size={11} />}
                        </button>
                        {activeDropdown === user.id && !isCurrentUser && (
                          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[140px]">
                            {(['active', 'inactive', 'suspended'] as UserStatus[]).map(s => {
                              const m = STATUS_META[s];
                              return (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(user.id, s)}
                                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-gray-50 transition-colors ${user.status === s ? `${m.bg} ${m.color}` : 'text-gray-700'}`}
                                >
                                  {m.icon} {m.label}
                                  {user.status === s && <span className="ml-auto text-[10px]">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Activity Stats */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <TrendingUp size={11} /> ₹{Number(user.total_income).toLocaleString()}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <TrendingDown size={11} /> ₹{Number(user.total_expense).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight size={10} /> {user.transaction_count} txns
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet size={10} /> {user.payment_accounts_count} accounts
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={11} className="text-gray-400" />
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {!isCurrentUser ? (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            Showing {filtered.length} of {totalUsers} users
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
