import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  TextField,
  LinearProgress,
  IconButton
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";

const Profile = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [goalType, setGoalType] = useState("");
  const [goalValue, setGoalValue] = useState("");
  const [goalFrequency, setGoalFrequency] = useState("");
  const [goals, setGoals] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleCreateGoal = () => {
    const newGoal = {
      id: goals.length + 1,
      type: goalType,
      value: goalValue,
      frequency: goalFrequency,
    };
    setGoals([...goals, newGoal]);
    setOpenModal(false);
    setGoalType("");
    setGoalValue("");
    setGoalFrequency("");
  };

  const handleDeleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="w-full max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
              <Button variant="contained" color="primary" className="mb-4" onClick={() => setOpenModal(true)}>
                Add New Goal
              </Button>
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 mb-4 bg-gray-100 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <Typography variant="h6" className="font-semibold">
                      {goal.type}: {goal.value}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {goal.frequency}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(goal.value, 100)}
                      sx={{ height: 12, borderRadius: 6, "& .MuiLinearProgress-bar": { backgroundColor: "#4CAF50" } }}
                    />
                  </div>
                  <IconButton onClick={() => handleDeleteGoal(goal.id)} color="secondary">
                    <Delete />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          <Select fullWidth value={goalType} onChange={(e) => setGoalType(e.target.value)} displayEmpty>
            <MenuItem value="">Set Goal Type</MenuItem>
            <MenuItem value="Calories">Calorie</MenuItem>
            <MenuItem value="Step">Step</MenuItem>
          </Select>
          <TextField
            fullWidth
            type="number"
            label="Goal"
            variant="outlined"
            className="mt-4"
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
          />
          <Select fullWidth value={goalFrequency} onChange={(e) => setGoalFrequency(e.target.value)} displayEmpty className="mt-4">
            <MenuItem value="">Select Goal Frequency</MenuItem>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="secondary">İptal</Button>
          <Button onClick={handleCreateGoal} color="primary" disabled={!goalType || !goalValue || !goalFrequency}>Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Profile;