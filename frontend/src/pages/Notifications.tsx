import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Info,
  Filter,
  Search
} from 'lucide-react';
import apiClient from '../services/api';
import { Notification } from '../types';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications'),
    staleTime: 5 * 60 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => apiClient.post(`/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  const filteredNotifications = notifications?.filter((notification) => {
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.read) ||
                         (statusFilter === 'unread' && !notification.read);
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'project_updated':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'invoice_created':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'payment_received':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-100 text-blue-800';
      case 'task_completed':
        return 'bg-green-100 text-green-800';
      case 'project_updated':
        return 'bg-purple-100 text-purple-800';
      case 'invoice_created':
        return 'bg-orange-100 text-orange-800';
      case 'payment_received':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">
            Stay updated with your project activities and system alerts.
          </p>
        </div>
        {notifications && notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Check className="h-5 w-5 mr-2" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Notifications
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="task_assigned">Task Assigned</option>
              <option value="task_completed">Task Completed</option>
              <option value="project_updated">Project Updated</option>
              <option value="invoice_created">Invoice Created</option>
              <option value="payment_received">Payment Received</option>
              <option value="reminder">Reminder</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {notification.message}
                  </p>

                  {notification.metadata && (
                    <div className="text-xs text-gray-500">
                      {notification.metadata.projectName && (
                        <span>Project: {notification.metadata.projectName}</span>
                      )}
                      {notification.metadata.taskTitle && (
                        <span>Task: {notification.metadata.taskTitle}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <Bell className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more notifications.'
                : 'You\'re all caught up! No new notifications.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
