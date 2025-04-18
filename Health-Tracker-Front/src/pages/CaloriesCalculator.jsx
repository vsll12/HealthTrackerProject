import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../partials/Header";
import Sidebar from "../partials/Sidebar";
import Calculator from "../components/Calculator";
import { Container } from "@mui/material";

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Calculator />
      </div>
    </div>
  );
};

export default Profile;
