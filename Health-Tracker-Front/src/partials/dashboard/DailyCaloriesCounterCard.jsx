import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import EditMenu from "../../components/DropdownEditMenu";
import { getCssVariable } from "../../utils/Utils";
import axios from "axios";

const API_BASE_URL = "https://localhost:7094/api/CaloriesChart";
const CHART_HEIGHT = 128;

function DailyCaloriesCounterCard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const token = localStorage.getItem("token");

  const [caloriesData, setCaloriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCalories, setNewCalories] = useState("");
  const [todayData, setTodayData] = useState(null);

  const formatDayOfWeek = (dayOfWeek) =>
    dayOfWeek.length > 3 ? dayOfWeek.substring(0, 3) : dayOfWeek;

  const fetchCaloriesData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawData = response.data;

      if (!Array.isArray(rawData)) {
        throw new Error("Invalid data format");
      }

      const formattedData = rawData
        .map((item) => ({
          id: item.id,
          day: formatDayOfWeek(item.dayOfWeek),
          date: new Date(item.date),
          calories: item.calories,
        }))
        .sort((a, b) => a.date - b.date);

      setCaloriesData(formattedData);

      const todayISOString = new Date().toISOString().slice(0, 10);
      const todayEntry = formattedData.find(
        (item) => item.date.toISOString().slice(0, 10) === todayISOString
      );

      setTodayData(todayEntry);
      setNewCalories(todayEntry ? todayEntry.calories.toString() : "");
      setError(null);
    } catch (err) {
      setError("Could not load calories data. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleCaloriesChange = (e) => setNewCalories(e.target.value);

  const submitCaloriesCount = async () => {
    if (!newCalories || isNaN(newCalories) || parseInt(newCalories) < 0) {
      setError("Please enter a valid calories count");
      return;
    }

    try {
      const calories = parseInt(newCalories);

      if (todayData) {
        await axios.put(
          `${API_BASE_URL}/${todayData.id}`,
          { calories },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          API_BASE_URL,
          { calories },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchCaloriesData();
      setError(null);
    } catch (err) {
      setError("Failed to update calories count. Please try again.");
      console.error(err);
    }
  };

  const averageCalories =
    caloriesData.length > 0
      ? Math.round(
          caloriesData.reduce((sum, day) => sum + day.calories, 0) /
            caloriesData.length
        )
      : 0;

  useEffect(() => {
    fetchCaloriesData();
  }, [fetchCaloriesData]);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    if (!chartRef.current || caloriesData.length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    const violetColor = getCssVariable("--color-violet-500") || "#8b5cf6";
    const violetHoverColor = getCssVariable("--color-violet-600") || "#7c3aed";

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: caloriesData.map((item) => item.day),
        datasets: [
          {
            label: "Calories",
            data: caloriesData.map((item) => item.calories),
            backgroundColor: violetColor,
            hoverBackgroundColor: violetHoverColor,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (tooltipItems) =>
                caloriesData[tooltipItems[0].dataIndex].date.toLocaleDateString(),
              label: (context) => `${context.parsed.y.toLocaleString()} calories`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { drawBorder: false },
            ticks: {
              callback: (value) =>
                value > 999 ? `${(value / 1000).toFixed(1)}k` : value,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [caloriesData]);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Daily Calories Tracker
          </h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                to="#0"
                onClick={fetchCaloriesData}
              >
                Refresh Data
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                to="#0"
              >
                Set Goals
              </Link>
            </li>
            <li>
              <Link
                className="font-medium text-sm text-red-500 hover:text-red-600 flex py-1 px-3"
                to="#0"
              >
                Reset Week
              </Link>
            </li>
          </EditMenu>
        </header>

        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">
          Weekly Progress
        </div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            {averageCalories.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">
            Avg Calories
          </div>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      )}

      <div className="px-5 py-3 flex flex-wrap items-center gap-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading data...</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Today ({new Date().toLocaleDateString()})
            </div>
            <input
              style={{width:150}}
              type="number"
              value={newCalories}
              onChange={handleCaloriesChange}
              placeholder="Enter calories"
              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-24"
            />
            <button
              onClick={submitCaloriesCount}
              className="px-2 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
            >
              {todayData ? "Update" : "Add"}
            </button>
          </>
        )}
      </div>

      <div className="grow max-sm:max-h-[128px] xl:max-h-[128px] px-2 flex items-center justify-center">
        {isLoading ? (
          <div className="text-gray-500">Loading chart data...</div>
        ) : caloriesData.length > 0 ? (
          <canvas ref={chartRef} height={CHART_HEIGHT}></canvas>
        ) : (
          <div className="text-gray-500">No calories data available yet</div>
        )}
      </div>
    </div>
  );
}

export default DailyCaloriesCounterCard;
