import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const painOptions = [
  { label: "Headache", value: "headache" },
  { label: "Migraine", value: "migraine" },
  { label: "Toothache", value: "toothache" },
  { label: "Back Pain", value: "back pain" },
  { label: "Neck Pain", value: "neck pain" },
  { label: "Shoulder Pain", value: "shoulder pain" },
  { label: "Muscle Pain", value: "muscle pain" },
  { label: "Joint Pain", value: "joint pain" },
  { label: "Knee Pain", value: "knee pain" },
  { label: "Chest Pain", value: "chest pain" },
  { label: "Abdominal Pain", value: "abdominal pain" },
  { label: "Stomach Pain", value: "stomach pain" },
  { label: "Period Pain", value: "menstrual cramps" },
  { label: "Earache", value: "earache" },
  { label: "Eye Pain", value: "eye pain" },
  { label: "Throat Pain", value: "sore throat" },
  { label: "Nerve Pain", value: "nerve pain" },
  { label: "Burning Pain", value: "burning pain" },
  { label: "Pelvic Pain", value: "pelvic pain" },
  { label: "Generalized Pain", value: "general pain" },
];

const MedicineInformation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const handleSearch = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.fda.gov/drug/label.json?search=indications_and_usage:${symptom}&limit=5`
      );
      setDrugs(response.data.results);
    } catch (error) {
      console.error("API Error:", error);
      setDrugs([]);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="p-6 max-w-6xl mx-auto w-full">
          <div className="text-center mb-8">
            <Typography variant="h4" className="font-bold text-gray-800">
              <LocalHospitalIcon className="text-purple-600 mr-2" />
              Drug Information Search
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-1">
              Choose a pain type to find relevant medications.
            </Typography>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 items-center justify-center">
            <FormControl fullWidth className="bg-white rounded-xl">
              <InputLabel>Select pain type</InputLabel>
              <Select
                value={symptom}
                label="Select pain type"
                onChange={(e) => setSymptom(e.target.value)}
              >
                {painOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={!symptom}
              className="whitespace-nowrap rounded-xl bg-purple-600 hover:bg-purple-700"
            >
              Search Drugs
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <CircularProgress />
            </div>
          ) : drugs.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <Typography variant="body1">
                No drug information found or no search performed yet.
              </Typography>
            </div>
          ) : (
            <Grid container spacing={3}>
              {drugs.map((drug, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card className="rounded-2xl shadow-lg transition hover:shadow-2xl hover:scale-[1.02] duration-200 bg-white">
                    <CardContent>
                      <Typography
                        variant="h6"
                        className="font-semibold text-purple-700"
                      >
                        {drug.openfda?.brand_name?.[0] || "Unknown Drug"}
                      </Typography>
                      <Typography className="text-sm mt-2 text-gray-700">
                        <strong>Active Ingredient:</strong>{" "}
                        {drug.openfda?.substance_name?.[0] || "Unknown"}
                      </Typography>
                      <Typography className="text-sm mt-2 text-gray-700">
                        <strong>Usage:</strong>{" "}
                        {drug.indications_and_usage?.[0] || "Not specified"}
                      </Typography>
                      <Typography className="text-sm mt-2 text-gray-700">
                        <strong>Side Effects:</strong>{" "}
                        {drug.adverse_reactions?.[0] || "Not listed"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <div className="mt-10 text-center">
            <Typography
              variant="body2"
              color="error"
              className="text-sm flex justify-center items-center gap-1"
            >
              <WarningAmberIcon fontSize="small" />
              This information is for educational purposes only. Please consult
              your doctor before taking any medication.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineInformation;
