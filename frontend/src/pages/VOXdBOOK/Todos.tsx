import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import api from '../../services/smartApi';

interface Todo {
  id: number;
  title: string;
  status: string;
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await api.post('/todos', { title: newTodo, status: 'pending' });
      setTodos([response.data, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/todos/${todo.id}`, { ...todo, status: newStatus });
      setTodos(todos.map(t => t.id === todo.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quick Todos</h1>
        <p className="text-gray-500 text-sm">Manage your daily checklists</p>
      </header>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleAddTodo} className="flex gap-3 mb-8">
          <input 
            type="text" 
            placeholder="Add a new item..." 
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button 
            type="submit" 
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus size={24} />
          </button>
        </form>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading todos...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-medium italic">Nothing to do yet!</div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                todo.status === 'completed' ? 'bg-green-50/50 border-green-100 opacity-70' : 'bg-gray-50 border-gray-200'
              }`}>
                <button onClick={() => toggleTodo(todo)} className="transition-transform active:scale-90">
                  {todo.status === 'completed' ? 
                    <CheckCircle2 className="text-green-500" size={24} /> : 
                    <Circle className="text-gray-300" size={24} />
                  }
                </button>
                <span className={`flex-1 text-sm font-medium text-gray-700 ${todo.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                  {todo.title}
                </span>
                <button 
                  onClick={() => deleteTodo(todo.id)} 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>

        {todos.some(t => t.status === 'completed') && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button 
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
              onClick={fetchTodos}
            >
              <RefreshCw size={16} />
              Refresh List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Todos;
