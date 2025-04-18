import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Container,
  CircularProgress,
  TextField,
} from "@mui/material";

const Profile = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If there's no token, redirect to login page
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("https://localhost:7094/api/Profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData({
          name: response.data.name,
          age: response.data.age,
          weight: response.data.weight,
          height: response.data.height,
        });
      } catch (error) {
        console.error("Profil yüklenirken hata oluştu:", error);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpdateProfile = async () => {
    const profileData = new FormData();
    profileData.append("name", formData.name);
    profileData.append("age", formData.age);
    profileData.append("weight", formData.weight);
    profileData.append("height", formData.height);

    if (selectedFile) {
      profileData.append("file", selectedFile);
    }

    try {
      const response = await axios.put(
        "https://localhost:7094/api/Profile",
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser((prev) => ({
        ...prev,
        ...formData,
        profileImagePath:
          response.data.ProfileImagePath || prev.profileImagePath,
      }));
      setIsEditing(false);
      alert("Profil başarıyla güncellendi!");
    } catch (error) {
      console.error("Profil güncellenirken hata oluştu:", error);
    }
  };

  if (!user)
    return (
      <CircularProgress style={{ margin: "50px auto", display: "block" }} />
    );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <Container maxWidth="sm" style={{ marginTop: "30px" }}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                <Avatar
                  src={`https://localhost:7094/uploads/${user.profileImagePath}`}
                  alt={user.name}
                  sx={{
                    width: 100,
                    height: 100,
                    margin: "auto",
                    boxShadow: 2,
                  }}
                />

                {isEditing ? (
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      margin="dense"
                      type="number"
                    />
                    <TextField
                      fullWidth
                      label="Weight (kg)"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      margin="dense"
                      type="number"
                    />
                    <TextField
                      fullWidth
                      label="Height (cm)"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      margin="dense"
                      type="number"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ marginTop: "10px" }}
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={handleUpdateProfile}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{ mt: 2, ml: 1 }}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {user.name}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <b>Age:</b> {user.age}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <b>Weight:</b> {user.weight} kg
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <b>Height:</b> {user.height} cm
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <b>Gender:</b> {user.gender}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      <b>Email:</b> {user.email}
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      color="primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Container>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
