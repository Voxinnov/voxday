import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Flag,
  CheckCircle2,
  Circle,
  Search,
  Tag
} from 'lucide-react';
import Modal from '../../components/Common/Modal';
import api from '../../services/smartApi';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  due_date: string;
  status: string;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (task: Task | null = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        due_date: new Date(task.due_date).toISOString().split('T')[0],
        status: task.status
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      alert('Error saving task');
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      alert('Error deleting task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks Management</h1>
          <p className="text-gray-500 text-sm">Organize and track your daily work</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all"
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 font-medium">
            No tasks found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className={`bg-white p-5 rounded-xl border transition-all ${
                task.status === 'completed' ? 'opacity-70 border-green-200 bg-green-50/10' : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}>
                <div className="flex gap-4 items-start">
                  <button 
                    onClick={() => toggleTaskStatus(task)}
                    className="mt-1 transition-transform active:scale-95"
                  >
                    {task.status === 'completed' ? 
                      <CheckCircle2 className="text-green-500" size={22} /> : 
                      <Circle className="text-gray-300" size={22} />
                    }
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-base font-bold text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Calendar size={14} />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                        <Flag size={14} />
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                      onClick={() => handleOpenModal(task)}
                    >
                      <Plus size={18} />
                    </button>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Tag size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Task Title</label>
            <input 
              type="text" 
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Description (Optional)</label>
            <textarea 
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select 
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.priority} 
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Due Date</label>
              <input 
                type="date" 
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.due_date} 
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
