import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';

const API_URL = 'https://localhost:7094';

const AllTodos = ({ userId }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/todos/user/${userId}/incomplete`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error('Failed to fetch incomplete todos:', err);
      setError('Could not fetch incomplete todos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTodos();
    }
  }, [userId]);

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete todo: ${res.status}`);
      }

      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">📝 Incomplete To-Dos</h2>

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 shadow">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading todos...</div>
      ) : todos.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <XCircle className="mx-auto mb-2" size={48} />
          <p className="text-lg">No incomplete todos found.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`p-5 rounded-2xl shadow transition-transform transform hover:scale-[1.02] border ${
                todo.isCompleted ? 'bg-green-100 border-green-300' : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-lg font-semibold">{todo.task}</div>
                <div className="flex items-center gap-2">
                  {!todo.isCompleted ? (
                    <XCircle className="text-red-500" size={20} />
                  ) : (
                    <CheckCircle className="text-green-500" size={20} />
                  )}
                  <button onClick={() => handleDelete(todo.id)} title="Delete">
                    <Trash2 className="text-gray-500 hover:text-red-600" size={20} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Due: {new Date(todo.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllTodos;
