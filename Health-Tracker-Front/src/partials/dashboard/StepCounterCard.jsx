import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import EditMenu from "../../components/DropdownEditMenu";

import { getCssVariable } from "../../utils/Utils";
import axios from "axios";

const API_BASE_URL = "https://localhost:7094/api/StepsChart";

function DailyStepCounterCard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const token = localStorage.getItem("token");

  const [stepData, setStepData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newSteps, setNewSteps] = useState("");
  const [todayData, setTodayData] = useState(null);

  const fetchStepData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data; 

      // Günleri sırala ve formatla
      const formattedData = data.map((item) => ({
        id: item.id,
        day: formatDayOfWeek(item.dayOfWeek),
        date: new Date(item.date),
        steps: item.steps,
      })).sort((a, b) => a.date - b.date);

      setStepData(formattedData);

      // Bugünün verisini bul
      const today = new Date();
      const todayEntry = formattedData.find(
        item => item.date.toDateString() === today.toDateString()
      );

      setTodayData(todayEntry);
      
      // Eğer bugünün verisi varsa, adım sayısını ayarla
      if (todayEntry) {
        setNewSteps(todayEntry.steps.toString());
      } else {
        setNewSteps("");
      }

      setError(null);
    } catch (err) {
      setError("Adım verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDayOfWeek = (dayOfWeek) => {
    // Farklı formatlara destek
    if (dayOfWeek.length > 3) {
      return dayOfWeek.substring(0, 3);
    }
    return dayOfWeek;
  };

  const handleStepChange = (e) => {
    setNewSteps(e.target.value);
  };

  const submitStepCount = async () => {
    if (!newSteps || isNaN(newSteps) || parseInt(newSteps) < 0) {
      setError("Please enter a valid step count");
      return;
    }

    try {
      const steps = parseInt(newSteps);

      if (todayData) {
        // Bugünün verisi varsa güncelle
        await axios.put(
          `${API_BASE_URL}/${todayData.id}`,
          { steps },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Bugünün verisi yoksa yeni ekle
        await axios.post(
          API_BASE_URL,
          { steps },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      fetchStepData();
      setError(null);
    } catch (err) {
      setError("Failed to update step count. Please try again.");
      console.error(err);
    }
  };

  const averageSteps =
    stepData.length > 0
      ? Math.round(
          stepData.reduce((sum, day) => sum + day.steps, 0) / stepData.length
        )
      : 0;

  useEffect(() => {
    fetchStepData();
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current || stepData.length === 0) return;

    const ctx = chartRef.current.getContext("2d");

    const violetColor =
      typeof getCssVariable === "function"
        ? getCssVariable("--color-violet-500")
        : "#8b5cf6";

    const violetHoverColor =
      typeof getCssVariable === "function"
        ? getCssVariable("--color-violet-600")
        : "#7c3aed";

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: stepData.map((item) => item.day),
        datasets: [
          {
            label: "Steps",
            data: stepData.map((item) => item.steps),
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
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                return stepData[index].date.toLocaleDateString();
              },
              label: (context) => `${context.parsed.y.toLocaleString()} steps`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
            },
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
      }
    };
  }, [stepData]);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Daily Step Counter
          </h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <Link
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                to="#0"
                onClick={fetchStepData}
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
            {averageSteps.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">
            Avg Steps
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-5 py-2">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      )}

      {/* Step input form */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-2">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading data...</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Today ({new Date().toLocaleDateString()})
            </div>
            <input
              type="number"
              value={newSteps}
              onChange={handleStepChange}
              placeholder="Enter steps"
              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-24"
            />
            <button
              onClick={submitStepCount}
              className="px-2 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
            >
              {todayData ? "Update" : "Add"}
            </button>
          </>
        )}
      </div>

      {/* Chart container */}
      <div className="grow max-sm:max-h-[128px] xl:max-h-[128px] px-2 flex items-center justify-center">
        {isLoading ? (
          <div className="text-gray-500">Loading chart data...</div>
        ) : stepData.length > 0 ? (
          <canvas ref={chartRef} height="128"></canvas>
        ) : (
          <div className="text-gray-500">No step data available yet</div>
        )}
      </div>
    </div>
  );
}

export default DailyStepCounterCard;