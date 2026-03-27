import React, { useState, useEffect, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Pause, Square, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '../services/api';
import { TimeEntry, Task } from '../types';

interface ManualTimeForm {
  taskId: number;
  startTime: string;
  endTime: string;
  notes: string;
}

const TimeTracker: React.FC = () => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();

  const { data: runningEntry } = useQuery<TimeEntry | null>({
    queryKey: ['running-time-entry'],
    queryFn: async () => {
      try {
        return await apiClient.get('/time-entries/running');
      } catch {
        return null;
      }
    },
    refetchInterval: (data) => {
      // Only poll if there's a running entry, otherwise poll less frequently
      return data ? 10000 : 60000; // 10 seconds if running, 60 seconds if not
    },
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: true, // Only refetch on mount
  });

  const { data: currentTask } = useQuery<Task>({
    queryKey: ['task', runningEntry?.taskId],
    queryFn: () => apiClient.get(`/tasks/${runningEntry?.taskId}`),
    enabled: !!runningEntry?.taskId,
  });

  const { data: availableTasks } = useQuery<Task[]>({
    queryKey: ['user-tasks'],
    queryFn: () => apiClient.get('/tasks?assignedToMe=true'),
  });

  const stopTimerMutation = useMutation({
    mutationFn: (entryId: number) => apiClient.post('/time-entries/stop', { entryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['running-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Timer stopped');
    },
    onError: () => toast.error('Failed to stop timer'),
  });

  const manualTimeMutation = useMutation({
    mutationFn: (data: ManualTimeForm) => apiClient.post('/time-entries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowManualForm(false);
      toast.success('Time entry created');
    },
    onError: () => toast.error('Failed to create time entry'),
  });

  const { register, handleSubmit, reset, setValue } = useForm<ManualTimeForm>();

  // Calculate elapsed time
  useEffect(() => {
    if (runningEntry) {
      const startTime = new Date(runningEntry.startTime).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [runningEntry]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopTimer = () => {
    if (runningEntry) {
      stopTimerMutation.mutate(runningEntry.id);
    }
  };

  const onSubmitManualTime = (data: ManualTimeForm) => {
    manualTimeMutation.mutate(data);
    reset();
  };

  const openManualForm = () => {
    setShowManualForm(true);
    // Set default times
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setValue('startTime', oneHourAgo.toISOString().slice(0, 16));
    setValue('endTime', now.toISOString().slice(0, 16));
  };

  if (!runningEntry && !showManualForm) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={openManualForm}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Log Time
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {runningEntry ? (
        <>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary-100 rounded-md">
            <Clock className="h-4 w-4 text-primary-600" />
            <div className="text-sm">
              <div className="font-medium text-primary-900">
                {currentTask?.title || 'Unknown Task'}
              </div>
              <div className="text-primary-700 font-mono">
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>
          <button
            onClick={handleStopTimer}
            disabled={stopTimerMutation.isPending}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <Square className="h-4 w-4 mr-1" />
            {stopTimerMutation.isPending ? 'Stopping...' : 'Stop'}
          </button>
        </>
      ) : (
        <button
          onClick={openManualForm}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          Log Time
        </button>
      )}

      {/* Manual Time Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowManualForm(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Log Time Manually</h3>
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmitManualTime)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
                    <select
                      {...register('taskId', { required: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a task</option>
                      {availableTasks?.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        {...register('startTime', { required: true })}
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        {...register('endTime', { required: true })}
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Optional notes about this time entry"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={manualTimeMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {manualTimeMutation.isPending ? 'Creating...' : 'Create Entry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TimeTracker);
