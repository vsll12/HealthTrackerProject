import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CircularProgress,
} from "@mui/material";

// Kas grupları ve seviyeler
const muscleGroups = [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
];

const levels = ["beginner", "intermediate", "advanced"];

// Örnek antrenman planları
const workoutPlans = [
  {
    title: "🏋️ Beginner Full Body Plan",
    description:
      "Ideal for those starting out. Focuses on bodyweight and simple movements.",
    exercises: ["Push-ups", "Bodyweight Squats", "Plank (30 sec)", "Lunges", "Jumping Jacks"],
  },
  {
    title: "🔥 Intermediate Upper Body Split",
    description:
      "Build strength with resistance training focused on the upper body.",
    exercises: ["Pull-ups", "Dumbbell Chest Press", "Shoulder Press", "Bicep Curls", "Tricep Dips"],
  },
  {
    title: "💪 Advanced Legs and Core Challenge",
    description:
      "Push your lower body with explosive and core-intensive movements.",
    exercises: ["Barbell Squats", "Deadlifts", "Leg Press", "Russian Twists", "Hanging Leg Raises"],
  },
];

const ExerciseBrowser = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchExercises = async () => {
    if (!selectedMuscle || !selectedLevel) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${selectedMuscle}`,
        {
          headers: {
            "X-RapidAPI-Key": "c11173dbf9mshef40fd542f60e1ep1f022fjsn58cd224fd8a9",
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
        }
      );

      const filtered = response.data.filter((exercise, index) => {
        if (selectedLevel === "beginner") return index % 3 === 0;
        if (selectedLevel === "intermediate") return index % 3 === 1;
        if (selectedLevel === "advanced") return index % 3 === 2;
        return true;
      });

      setExercises(filtered);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [selectedMuscle, selectedLevel]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
            🏋️‍♂️ Personal Exercise Browser
          </h1>

          {/* Dropdown Filters */}
          <div className="flex flex-col md:flex-row gap-6 mb-10 justify-center">
            <FormControl className="w-full md:w-1/3 bg-white rounded-lg shadow-sm">
              <InputLabel>Muscle Group</InputLabel>
              <Select
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
              >
                {muscleGroups.map((muscle) => (
                  <MenuItem key={muscle} value={muscle}>
                    {muscle.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl className="w-full md:w-1/3 bg-white rounded-lg shadow-sm">
              <InputLabel>Level</InputLabel>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {levels.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-10">
              <CircularProgress color="primary" />
            </div>
          ) : exercises.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {exercises.map((ex) => (
                <Card
                  key={ex.id}
                  className="rounded-2xl shadow-lg transition-transform hover:scale-105 hover:shadow-xl duration-300"
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={ex.gifUrl}
                    alt={ex.name}
                    className="object-contain bg-gray-100 rounded-t-2xl"
                  />
                  <CardContent className="bg-white">
                    <Typography
                      variant="h6"
                      className="font-semibold capitalize text-gray-800"
                    >
                      {ex.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-500 mt-2"
                    >
                      Target:{" "}
                      <span className="capitalize">{ex.target}</span> | Equipment:{" "}
                      <span className="capitalize">{ex.equipment}</span>
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !selectedMuscle &&
            !selectedLevel && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {workoutPlans.map((plan, idx) => (
                  <Card
                    key={idx}
                    className="rounded-2xl shadow-lg transition-transform hover:scale-105 hover:shadow-xl duration-300"
                  >
                    <CardContent className="bg-white">
                      <Typography variant="h6" className="font-semibold text-gray-800 mb-2">
                        {plan.title}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 mb-4">
                        {plan.description}
                      </Typography>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {plan.exercises.map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseBrowser;
