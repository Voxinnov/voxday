import React, { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  FileText, 
  TrendingUp,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
import { DashboardSummary } from '../types';

const Dashboard: React.FC = () => {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get('/dashboard/summary'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const stats = [
    {
      name: 'Total Projects',
      value: summary?.totalProjects || 0,
      icon: FolderOpen,
      color: 'bg-blue-500',
      href: '/projects',
    },
    {
      name: 'Active Projects',
      value: summary?.activeProjects || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/projects?status=active',
    },
    {
      name: 'Open Tasks',
      value: summary?.openTasks || 0,
      icon: CheckSquare,
      color: 'bg-yellow-500',
      href: '/tasks?status=pending,in_progress',
    },
    {
      name: 'Completed Tasks',
      value: summary?.completedTasks || 0,
      icon: CheckSquare,
      color: 'bg-green-500',
      href: '/tasks?status=completed',
    },
    {
      name: 'Time Entries',
      value: summary?.totalTimeEntries || 0,
      icon: Clock,
      color: 'bg-purple-500',
      href: '/time-tracking',
    },
    {
      name: 'Total Invoices',
      value: summary?.totalInvoices || 0,
      icon: FileText,
      color: 'bg-indigo-500',
      href: '/invoices',
    },
    {
      name: 'Pending Invoices',
      value: summary?.pendingInvoices || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      href: '/invoices?status=draft,sent',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's an overview of your projects and tasks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/projects/new"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <FolderOpen className="h-5 w-5 mr-3 text-primary-600" />
              Create New Project
            </Link>
            <Link
              to="/tasks/new"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <CheckSquare className="h-5 w-5 mr-3 text-primary-600" />
              Create New Task
            </Link>
            <Link
              to="/time-tracking"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Clock className="h-5 w-5 mr-3 text-primary-600" />
              Start Time Tracking
            </Link>
            <Link
              to="/invoices/new"
              className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <FileText className="h-5 w-5 mr-3 text-primary-600" />
              Create Invoice
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span>Project "VOXTREE Development" was created</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span>Task "Implement authentication" was assigned</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span>Time entry logged for 2 hours</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span>Invoice #001 was sent to client</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
