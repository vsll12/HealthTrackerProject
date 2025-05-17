import React, { useState, useEffect } from "react";
import EditMenu from "../../components/DropdownEditMenu";

function HealthAdviceCard() {
  const [advice, setAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdvice = async () => {
    try {
      setIsLoading(true);

      const exampleAdviceList = [
        "Drink plenty of water throughout the day.",
        "Eat a balanced diet rich in fruits, vegetables, and whole grains.",
        "Exercise regularly, at least 30 minutes a day.",
        "Get enough sleep—7 to 9 hours per night is ideal.",
        "Practice mindfulness or meditation to reduce stress.",
        "Limit your intake of processed foods and sugary snacks.",
        "Take breaks from sitting—stand and move every hour.",
        "Maintain a healthy weight for your body type.",
        "Don’t skip breakfast—it kickstarts your metabolism.",
        "Avoid smoking and limit alcohol consumption.",
        "Wear sunscreen to protect your skin from UV damage.",
        "Practice good hygiene—wash your hands regularly.",
        "Keep your mind sharp with brain exercises or learning new things.",
        "Make time for hobbies and activities that make you happy.",
        "Regularly check your health numbers (blood pressure, cholesterol, etc.).",
        "Stay socially connected to friends and family for emotional support.",
        "Avoid over-exercising—rest is just as important as working out.",
        "Maintain good posture to avoid back and neck strain.",
        "Listen to your body—don’t ignore signs of fatigue or discomfort.",
        "Set achievable health goals and track your progress."
        ];
      const randomAdvice =
        exampleAdviceList[Math.floor(Math.random() * exampleAdviceList.length)];
      setAdvice(randomAdvice);
    } catch (err) {
      setError("Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl pb-5">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Health Advice
          </h2>
          <EditMenu align="right" className="relative inline-flex">
            <li>
              <button
                onClick={fetchAdvice}
                className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
              >
                Refresh Advice
              </button>
            </li>
          </EditMenu>
        </header>
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading advice...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <div className="text-base font-medium text-gray-800 dark:text-gray-100">
            {advice}
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthAdviceCard;
