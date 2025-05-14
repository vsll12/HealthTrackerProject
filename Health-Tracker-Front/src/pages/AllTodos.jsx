import React, { useEffect, useState } from 'react';

const API_URL = 'https://localhost:7094';

const AllTodos = ({ userId }) => {
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIncompleteTodos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
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
      }
    };

    if (userId) {
      fetchIncompleteTodos();
    }
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Incomplete To-Dos</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {todos.length === 0 ? (
        <p className="text-gray-500">No incomplete todos found.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`p-4 rounded-md shadow-sm ${todo.isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{todo.task}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(todo.date).toLocaleDateString()}
                  </p>
                </div>
                {!todo.isCompleted && (
                  <span className="text-red-600 font-semibold">Not Completed</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllTodos;
