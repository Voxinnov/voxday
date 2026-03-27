import React, { useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Clock,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Target,
  Shield,
  BookOpen,
  Calculator,
  ArrowRightLeft,
  ListChecks,
  Tag,
  Smartphone,
  RefreshCw,
  BellRing,
  Lightbulb,
  Utensils,
  Car
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TimeTracker from './TimeTracker';
import GlobalReminder from './GlobalReminder';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/voxdbook', icon: Home },
    { name: 'Transactions', href: '/voxdbook/transactions', icon: ArrowRightLeft },
    { name: 'Renewal Reminder', href: '/voxdbook/renewals', icon: RefreshCw },
    { name: 'Reminder', href: '/voxdbook/reminders', icon: BellRing },
    { name: 'Tasks', href: '/voxdbook/tasks', icon: CheckSquare },
    { name: 'Quick Todos', href: '/voxdbook/todos', icon: ListChecks },
    { name: 'Notes', href: '/voxdbook/notes', icon: Lightbulb },
    { name: 'Diet Planner', href: '/voxdbook/diet-planner', icon: Utensils },
    { name: 'Day Planner', href: '/voxdbook/day-planner', icon: Clock },
    { name: 'Goal Tracker', href: '/voxdbook/goal-tracker', icon: Target },
    { name: 'Categories', href: '/voxdbook/categories', icon: Tag },
    { name: 'Vehicle Management', href: '/voxdbook/vehicle-management', icon: Car },
    { name: 'Mobile App', href: '/download', icon: Smartphone },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-white font-bold text-sm">
                    S
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  VOXdBOOK
                </h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <span className="text-white font-bold text-sm">
                  S
                </span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                VOXdBOOK
              </h1>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 lg:border-none">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1">
              <TimeTracker />
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* User menu */}
              <div className="relative ml-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.role?.name || 'Loading...'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-600"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
      <GlobalReminder />
    </div>
  );
};

export default memo(Layout);