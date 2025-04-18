import { useState, useEffect } from "react";
import axios from "axios";

const DrinkWaterCard = () => {
  const totalCups = 8;
  const cupSize = 250;
  const goal = 2000;
  const [fullCups, setFullCups] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  // Bugünkü verileri yükle
  useEffect(() => {
    const fetchTodayIntake = async () => {
      try {
        const response = await axios.get("https://localhost:7094/api/WaterIntake/today", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const cups = Math.min(Math.floor(response.data.totalIntake / cupSize), totalCups);
        setFullCups(cups);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayIntake();
  }, []);

  const handleCupClick = async (idx) => {
    const newFullCups = fullCups === idx + 1 ? idx : idx + 1;
    const amountToAdd = (newFullCups - fullCups) * cupSize;

    try {
      await axios.post("https://localhost:7094/api/WaterIntake", amountToAdd, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      setFullCups(newFullCups);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Kayıt güncellenemedi");
    }
  };

  // Haftalık rapor verilerini çek
  const fetchWeeklyReport = async () => {
    try {
      const response = await axios.get("https://localhost:7094/api/WaterIntake/weekly", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("Haftalık rapor:", response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Rapor alınamadı");
    }
  };

  if (isLoading) return <div className="p-5 text-center">Yükleniyor...</div>;
  if (error) return <div className="p-5 text-red-500">Hata: {error}</div>;

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Su İçme Takibi</h2>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Hedef: 2 Litre</h3>
      
      <div className="flex justify-center mt-4">
        <div className="relative w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-lg flex flex-col justify-end items-center overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-blue-500 transition-all duration-300"
            style={{ height: `${(fullCups / totalCups) * 100}%` }}
          ></div>
          <span className="relative text-white font-semibold z-10 mb-1">
            {`${Math.round((fullCups / totalCups) * 100)}%`}
          </span>
        </div>
      </div>
      
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 text-center">
        {`Kalan: ${((goal - fullCups * cupSize) / 1000).toFixed(1)} Litre`}
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
            250 ml
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrinkWaterCard;