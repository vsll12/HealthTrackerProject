import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";

const Calculator = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [foodData, setFoodData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate]);

  const fetchNutritionData = async () => {
    try {
      const response = await axios.post(
        "https://trackapi.nutritionix.com/v2/natural/nutrients",
        { query },
        {
          headers: {
            "x-app-id": "480b2208",
            "x-app-key": "5a44beeb5a409f8a3f10f2513a2699cb",
            "Content-Type": "application/json",
          },
        }
      );
      setFoodData(response.data.foods[0]);
      setError("");
    } catch (err) {
      setError("Failed to fetch nutrition data.");
      setFoodData(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              🧮 Nutrition Calculator
            </h1>

            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="e.g. 2 eggs, 1 apple"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={fetchNutritionData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Calculate
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-100 text-red-700 p-3 rounded-lg">
                {error}
              </div>
            )}

            {foodData && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="bg-gray-100 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2 text-gray-700">
                    🍽️ Food
                  </h2>
                  <p className="text-gray-800">{foodData.food_name}</p>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2 text-gray-700">
                    🔥 Calories
                  </h2>
                  <p className="text-gray-800">{foodData.nf_calories} kcal</p>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2 text-gray-700">
                    🧈 Fat
                  </h2>
                  <p className="text-gray-800">{foodData.nf_total_fat} g</p>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2 text-gray-700">
                    🥩 Protein
                  </h2>
                  <p className="text-gray-800">{foodData.nf_protein} g</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calculator;
