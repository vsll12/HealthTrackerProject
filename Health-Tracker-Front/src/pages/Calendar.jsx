import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pinnedDates, setPinnedDates] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const changeMonth = (offset) => {
    const newDate = new Date(year, month + offset, 1);
    setCurrentDate(newDate);
  };

  const togglePin = (day) => {
    const dateStr = `${year}-${month + 1}-${day}`;
    setPinnedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isPinned = pinnedDates.includes(`${year}-${month + 1}-${day}`);
      days.push(
        <div
          key={day}
          onClick={() => togglePin(day)}
          className={`cursor-pointer text-center p-4 rounded-md transition ${
            isPinned
              ? 'bg-violet-500 text-white'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-700 text-white rounded-lg shadow-md hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-300"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          ◀
        </button>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {currentDate.toLocaleString('en-US', { month: 'long' })} {year}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          ▶
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-lg font-semibold text-gray-600 dark:text-gray-300 mb-4">
        {weekdays.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-3">{renderDays()}</div>
    </div>
  );
};

export default Calendar;
