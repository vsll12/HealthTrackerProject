import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { MdKeyboardBackspace, MdEdit, MdDelete, MdCheckCircle, MdAdd } from 'react-icons/md';
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";

const API_URL = 'https://localhost:7094';

const Calendar = ({ userId }) => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pinnedDates, setPinnedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTask, setEditingTask] = useState('');
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem('token'),
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    newConnection
      .start()
      .then(() => {
        console.log('Connected to chat hub:', newConnection.state);
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error('Connection failed:', err);
        setError('Failed to connect to server. Please try again later.');
      });

    newConnection.on('ReceiveTodo', (todo) => {
      setTodos((prev) => {
        if (!prev.some((t) => t.id === todo.id)) {
          return [...prev, todo];
        }
        return prev;
      });
      setPinnedDates((prev) => {
        const dateStr = `${todo.date.split('T')[0]}`;
        return prev.includes(dateStr) ? prev : [...prev, dateStr];
      });
    });

    newConnection.on('UpdateTodo', (todo) => {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
    });

    newConnection.on('DeleteTodo', (todoId) => {
      setTodos((prev) => {
        const deletedTodo = prev.find((t) => t.id === todoId);
        if (deletedTodo) {
          const dateStr = `${new Date(deletedTodo.date).getFullYear()}-${new Date(deletedTodo.date).getMonth() + 1}-${new Date(deletedTodo.date).getDate()}`;
          const remainingTodos = prev.filter((t) => t.id !== todoId);
          if (!remainingTodos.some((t) => `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth() + 1}-${new Date(t.date).getDate()}` === dateStr)) {
            setPinnedDates((prevDates) => prevDates.filter((d) => d !== dateStr));
          }
          return remainingTodos;
        }
        return prev;
      });
    });

    return () => {
      if (newConnection) {
        newConnection.stop().then(() => console.log('Connection stopped'));
      }
    };
  }, [userId, navigate]);

  useEffect(() => {
    if (!selectedDate || !userId) return;

    const fetchTodos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          navigate('/login');
          return;
        }

        const response = await fetch(
          `${API_URL}/api/todos/user/${userId}?date=${selectedDate.toISOString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch todos: ${response.status}`);
        }

        const data = await response.json();
        setTodos(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching todos:', error);
        setError('Failed to load todos. Please try again.');
      }
    };

    fetchTodos();
  }, [selectedDate, userId, navigate]);

  useEffect(() => {
    const fetchPinnedDates = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/todos/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch todos: ${response.status}`);
        }

        const data = await response.json();
        const dates = [...new Set(data.map((todo) => {
          const date = new Date(todo.date);
          return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        }))];
        setPinnedDates(dates);
      } catch (error) {
        console.error('Error fetching pinned dates:', error);
      }
    };

    if (userId) fetchPinnedDates();
  }, [userId]);

  const changeMonth = (offset) => {
    const newDate = new Date(year, month + offset, 1);
    setCurrentDate(newDate);
  };

  const openTodoModal = (day) => {
    setSelectedDate(new Date(year, month, day));
    setNewTask('');
    setEditingTodoId(null);
  };

  const closeTodoModal = () => {
    setSelectedDate(null);
    setNewTask('');
    setEditingTodoId(null);
    setError(null);
  };

  const addTodo = async () => {
    if (!newTask.trim() || !connection) {
      setError('Please enter a task.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const todoDto = {
        userId,
        date: selectedDate,
        task: newTask,
        isCompleted: false,
      };

      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoDto),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create todo: ${response.status} - ${errorText}`);
      }

      const todo = await response.json();
      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('SendTodo', userId, todo.task, new Date(todo.date), todo.isCompleted);
      } else {
        setTodos((prev) => [...prev, todo]);
        setPinnedDates((prev) => {
          const dateStr = `${year}-${month + 1}-${selectedDate.getDate()}`;
          return prev.includes(dateStr) ? prev : [...prev, dateStr];
        });
      }

      setNewTask('');
      setError(null);
    } catch (error) {
      console.error('Error adding todo:', error);
      setError('Failed to add todo: ' + error.message);
    }
  };

  const updateTodo = async (todoId) => {
    if (!editingTask.trim() || !connection) {
      setError('Please enter a valid task.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const todoDto = {
        userId,
        date: selectedDate,
        task: editingTask,
        isCompleted: todos.find((t) => t.id === todoId).isCompleted,
      };

      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoDto),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update todo: ${response.status} - ${errorText}`);
      }

      const updatedTodo = await response.json();
      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('UpdateTodo', todoId, updatedTodo.task, new Date(updatedTodo.date), updatedTodo.isCompleted);
      } else {
        setTodos((prev) => prev.map((t) => (t.id === todoId ? updatedTodo : t)));
      }

      setEditingTodoId(null);
      setEditingTask('');
      setError(null);
    } catch (error) {
      console.error('Error updating todo:', error);
      setError('Failed to update todo: ' + error.message);
    }
  };

  const deleteTodo = async (todoId) => {
    if (!connection) {
      setError('Not connected to server.');
      return;
    }

    try {
      // Optimistically update state
      const deletedTodo = todos.find((t) => t.id === todoId);
      if (!deletedTodo) {
        setError('Todo not found locally.');
        return;
      }

      setTodos((prev) => {
        const dateStr = `${new Date(deletedTodo.date).getFullYear()}-${new Date(deletedTodo.date).getMonth() + 1}-${new Date(deletedTodo.date).getDate()}`;
        const remainingTodos = prev.filter((t) => t.id !== todoId);
        if (!remainingTodos.some((t) => `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth() + 1}-${new Date(t.date).getDate()}` === dateStr)) {
          setPinnedDates((prevDates) => prevDates.filter((d) => d !== dateStr));
        }
        return remainingTodos;
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          console.warn(`Todo ${todoId} already deleted or not found.`);
          // Skip SignalR call since todo is gone
          setError(null);
          return;
        }
        throw new Error(`Failed to delete todo: ${response.status} - ${errorText}`);
      }

      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('DeleteTodo', todoId);
      }

      setError(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
      if (error.message.includes('Todo not found')) {
        setError(null); // Suppress "not found" error
      } else {
        setError('Failed to delete todo: ' + error.message);
      }
    }
  };

  const toggleTodoCompletion = async (todoId) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo || !connection) return;

    try {
      const token = localStorage.getItem('token');
      const todoDto = {
        userId,
        date: todo.date,
        task: todo.task,
        isCompleted: !todo.isCompleted,
      };

      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoDto),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update todo: ${response.status} - ${errorText}`);
      }

      const updatedTodo = await response.json();
      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('UpdateTodo', todoId, updatedTodo.task, new Date(updatedTodo.date), updatedTodo.isCompleted);
      } else {
        setTodos((prev) => prev.map((t) => (t.id === todoId ? updatedTodo : t)));
      }

      setError(null);
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      setError('Failed to update todo: ' + error.message);
    }
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month + 1}-${day}`;
      const isPinned = pinnedDates.includes(dateStr);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

      days.push(
        <div
          key={day}
          onClick={() => openTodoModal(day)}
          className={`cursor-pointer text-center p-4 rounded-md transition relative ${
            isPinned
              ? 'bg-indigo-500 text-white'
              : isToday
              ? 'bg-indigo-100 text-indigo-800'
              : 'hover:bg-gray-200'
          }`}
        >
          {day}
          {isPinned && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="min-h-screen bg-gray-100 text-gray-900">
          <div className="p-8 max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="flex justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
              >
                ◀ Previous
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
              >
                Next ▶
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-lg font-semibold text-gray-600 mb-4">
              {weekdays.map((day) => (
                <div key={day} className="text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-3">{renderDays()}</div>
          </div>

          {/* Todo Modal */}
          {selectedDate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="w-full max-w-md p-6 rounded-lg shadow-xl bg-white text-gray-900">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    To-Dos for {selectedDate.toLocaleDateString()}
                  </h3>
                  <button
                    onClick={closeTodoModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
                    {error}
                  </div>
                )}

                {/* Todo Input */}
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 p-2 rounded-md border bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') addTodo();
                    }}
                  />
                  <button
                    onClick={addTodo}
                    className="ml-2 p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
                  >
                    <MdAdd size={20} />
                  </button>
                </div>

                {/* Todo List */}
                <div className="max-h-64 overflow-y-auto">
                  {todos.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tasks for this day.</p>
                  ) : (
                    <ul className="space-y-2">
                      {todos.map((todo) => (
                        <li
                          key={todo.id}
                          className="flex items-center justify-between p-2 rounded-md bg-opacity-50"
                        >
                          {editingTodoId === todo.id ? (
                            <div className="flex-1 flex items-center">
                              <input
                                type="text"
                                value={editingTask}
                                onChange={(e) => setEditingTask(e.target.value)}
                                className="flex-1 p-2 rounded-md border bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                              />
                              <button
                                onClick={() => updateTodo(todo.id)}
                                className="ml-2 p-1 text-indigo-500 hover:text-indigo-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingTodoId(null)}
                                className="ml-2 p-1 text-gray-500 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center flex-1">
                                <button
                                  onClick={() => toggleTodoCompletion(todo.id)}
                                  className={`mr-2 ${
                                    todo.isCompleted ? 'text-green-500' : 'text-gray-500'
                                  }`}
                                >
                                  <MdCheckCircle size={20} />
                                </button>
                                <span
                                  className={`text-sm ${todo.isCompleted ? 'line-through text-gray-500' : ''}`}
                                >
                                  {todo.task}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingTodoId(todo.id);
                                    setEditingTask(todo.task);
                                  }}
                                  className="p-1 text-indigo-500 hover:text-indigo-600"
                                >
                                  <MdEdit size={16} />
                                </button>
                                <button
                                  onClick={() => deleteTodo(todo.id)}
                                  className="p-1 text-red-500 hover:text-red-600"
                                >
                                  <MdDelete size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;