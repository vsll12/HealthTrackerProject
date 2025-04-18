import { useState } from "react";

export default function CalorieCalculator() {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(18);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(180);
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [goal, setGoal] = useState("maintain-weight");
  const [result, setResult] = useState(null);

  const calculate = () => {
    let bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers = {
      sedentary: 1.2,
      "lightly-active": 1.375,
      "moderately-active": 1.55,
      "very-active": 1.725,
      "extremely-active": 1.9,
    };

    let tdee = bmr * activityMultipliers[activityLevel];
    let protein = weight * 2.2;
    let fat = weight * 0.9;
    let carbs = (tdee - (protein * 4 + fat * 9)) / 4;

    setResult({ tdee, protein, fat, carbs });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🔥 Calorie Calculator
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight (kg)"
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Height (cm)"
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sedentary">Sedentary</option>
            <option value="lightly-active">Lightly Active</option>
            <option value="moderately-active">Moderately Active</option>
            <option value="very-active">Very Active</option>
            <option value="extremely-active">Extremely Active</option>
          </select>

          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lose-weight">Lose Weight</option>
            <option value="maintain-weight">Maintain Weight</option>
            <option value="gain-weight">Gain Weight</option>
          </select>

          <button
            onClick={calculate}
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Calculate
          </button>
        </div>

        {result && (
          <div className="mt-6 p-6 bg-gray-100 rounded-xl text-center space-y-2 text-gray-700">
            <p className="text-lg font-medium">
              🔋 Daily Calories: {result.tdee.toFixed(2)} kcal
            </p>
            <p>🥚 Protein: {result.protein.toFixed(2)} g</p>
            <p>🧈 Fat: {result.fat.toFixed(2)} g</p>
            <p>🍞 Carbs: {result.carbs.toFixed(2)} g</p>
          </div>
        )}
      </div>
    </div>
  );
}
