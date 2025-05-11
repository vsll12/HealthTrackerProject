import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";

const dietPrograms = [
  {
    id: 1,
    name: "Balanced Weight Loss Program",
    description: "A balanced approach to weight loss with moderate carbs, high protein, and healthy fats.",
    dailyCalories: "1500-1800",
    mealPlan: [
      {
        meal: "Breakfast",
        options: [
          "2 eggs with spinach and whole grain toast",
          "Greek yogurt with berries and nuts",
          "Oatmeal with banana and peanut butter"
        ]
      },
      {
        meal: "Lunch",
        options: [
          "Grilled chicken salad with olive oil dressing",
          "Tuna wrap with whole grain tortilla",
          "Lentil soup with a side salad"
        ]
      },
      {
        meal: "Dinner",
        options: [
          "Baked salmon with roasted vegetables",
          "Turkey meatballs with zucchini noodles",
          "Tofu stir-fry with brown rice"
        ]
      },
      {
        meal: "Snacks",
        options: [
          "Apple with almond butter",
          "Carrot sticks with hummus",
          "Greek yogurt with honey"
        ]
      }
    ]
  },
  {
    id: 2,
    name: "High Protein Fitness Program",
    description: "Designed for active individuals focusing on muscle maintenance and growth.",
    dailyCalories: "2000-2500",
    mealPlan: [
      {
        meal: "Breakfast",
        options: [
          "Protein smoothie with banana and protein powder",
          "5 egg whites with vegetables and avocado",
          "Cottage cheese with fruits and nuts"
        ]
      },
      {
        meal: "Lunch",
        options: [
          "Grilled chicken breast with quinoa and vegetables",
          "Turkey and vegetables wrap with hummus",
          "Tuna salad with mixed greens"
        ]
      },
      {
        meal: "Dinner",
        options: [
          "Lean beef steak with sweet potato and broccoli",
          "Baked chicken with brown rice and vegetables",
          "Salmon fillet with asparagus"
        ]
      },
      {
        meal: "Snacks",
        options: [
          "Protein bar",
          "Handful of nuts and seeds",
          "Boiled eggs"
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Mediterranean Diet Program",
    description: "Heart-healthy diet based on traditional foods from Mediterranean countries.",
    dailyCalories: "1800-2200",
    mealPlan: [
      {
        meal: "Breakfast",
        options: [
          "Greek yogurt with honey and walnuts",
          "Whole grain toast with avocado and tomato",
          "Omelette with feta cheese and vegetables"
        ]
      },
      {
        meal: "Lunch",
        options: [
          "Mediterranean salad with chickpeas and olive oil",
          "Whole grain pita with hummus and vegetables",
          "Lentil soup with a piece of whole grain bread"
        ]
      },
      {
        meal: "Dinner",
        options: [
          "Grilled fish with roasted vegetables",
          "Vegetable and bean stew with olive oil",
          "Chicken souvlaki with Greek salad"
        ]
      },
      {
        meal: "Snacks",
        options: [
          "Handful of olives and nuts",
          "Fresh fruits",
          "Small piece of dark chocolate"
        ]
      }
    ]
  }
];

const Calculator = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [foodData, setFoodData] = useState(null);
  const [error, setError] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);

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
    <div className="flex h-full bg-gray-50 min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8 mb-10">
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

          {/* Diet Programs Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              🥗 Diet Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dietPrograms.map(program => (
                <div
                  key={program.id}
                  className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                    selectedProgram === program.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() =>
                    setSelectedProgram(
                      selectedProgram === program.id ? null : program.id
                    )
                  }
                >
                  <h3 className="text-xl font-semibold mb-2">{program.name}</h3>
                  <p className="text-gray-600 mb-3">{program.description}</p>
                  <p className="text-sm font-medium">
                    Daily Calories: {program.dailyCalories}
                  </p>
                </div>
              ))}
            </div>

            {selectedProgram !== null && (
              <div className="mt-8 animate-fade-in border-t pt-6">
                <h3 className="text-xl font-bold mb-4">
                  {dietPrograms.find(p => p.id === selectedProgram).name} - Meal Plan
                </h3>
                <div className="space-y-6">
                  {dietPrograms
                    .find(p => p.id === selectedProgram)
                    .mealPlan.map((mealTime, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">
                          {mealTime.meal}
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {mealTime.options.map((option, idx) => (
                            <li key={idx} className="text-gray-700">
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
