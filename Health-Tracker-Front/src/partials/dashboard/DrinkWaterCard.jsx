import { useState, useEffect } from "react";
import axios from "axios";

const DrinkWaterCard = () => {
  const totalCups = 8;
  const [goal, setGoal] = useState(2000); // Default goal 2000ml
  const [fullCups, setFullCups] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem("token");
  const cupSize = goal / totalCups;

  useEffect(() => {
    const fetchWaterGoal = async () => {
      try {
        const response = await axios.get("https://localhost:7094/api/waterintake/goal", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        setGoal(response.data); // Set goal from the backend
      } catch (err) {
        setError("Failed to fetch water goal");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaterGoal();
  }, [token]);

  useEffect(() => {
    const fetchTodayIntake = async () => {
      try {
        const response = await axios.get("https://localhost:7094/api/WaterIntake/today", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        const cups = Math.min(Math.floor(response.data.totalIntake / cupSize), totalCups);
        setFullCups(cups);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };

    fetchTodayIntake();
  }, [goal, cupSize, token]);

  const handleCupClick = async (idx) => {
    const newFullCups = fullCups === idx + 1 ? idx : idx + 1;
    const amountToAdd = (newFullCups - fullCups) * cupSize;

    if (amountToAdd === 0) return;

    try {
      await axios.post("https://localhost:7094/api/WaterIntake", amountToAdd, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      setFullCups(newFullCups);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "");
    }
  };

  const handleGoalChange = async (newGoal) => {
    try {
      await axios.post(
        "https://localhost:7094/api/waterintake/goal",
        newGoal,
        { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setGoal(newGoal); 
    } catch (err) {
      setError("Failed to update water goal");
    }
  };

  if (isLoading) return <div className="p-5 text-center">Loading...</div>;
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Water Intake Tracker
      </h2>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Goal: {(goal / 1000).toFixed(1)} Litre
      </h3>

      <div className="relative mt-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition"
        >
          Change Water Goal
        </button>

        {showDropdown && (
          <div className="absolute z-10 mt-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md shadow-lg w-full">
            {[...Array(29)].map((_, i) => {
              const litre = i + 2;
              return (
                <div
                  key={litre}
                  onClick={() => {
                    handleGoalChange(litre * 1000);  
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-600 cursor-pointer"
                >
                  {litre} Litre
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <div className="relative w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-lg flex flex-col justify-end items-center overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-blue-500 transition-all duration-300"
            style={{ height: `${(fullCups / totalCups) * 100}%` }}
          ></div>
          <span className="relative text-white font-semibold z-10 mb-1">
            {Math.round((fullCups / totalCups) * 100)}%
          </span>
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 text-center">
        Remaining: {Math.max((goal - fullCups * cupSize) / 1000, 0).toFixed(1)} Litre
      </p>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[...Array(totalCups)].map((_, idx) => (
          <div
            key={idx}
            className={`w-12 h-12 flex justify-center items-center text-xs font-semibold border rounded-md cursor-pointer transition-all duration-300 ${
              idx < fullCups
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
            onClick={() => handleCupClick(idx)}
          >
            {cupSize} ml
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrinkWaterCard;
