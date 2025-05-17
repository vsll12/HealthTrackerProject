import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col">
      <header className="w-full bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="text-3xl font-bold text-blue-700">HealthTracker</div>
          <nav className="space-x-4">
            <Link to="/login">
              <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition">Login</button>
            </Link>
            <Link to="/register">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Register</button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="text-center mt-20 mb-24 px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-6 leading-tight">
            Take Charge of Your Health Today
          </h1>
          <p className="text-xl text-blue-900 max-w-3xl mx-auto mb-10">
            All-in-one platform to track your steps, stay hydrated, manage your meals and medications, and achieve your fitness goals.
          </p>
          <Link to="/register">
            <button className="bg-blue-700 text-white px-8 py-3 rounded-full text-lg shadow-md hover:bg-blue-800 transition">
              Get Started Free
            </button>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[ 
              {
                title: "Step Counter",
                description: "Track your steps daily and maintain an active lifestyle with personalized goals."
              },
              {
                title: "Water Tracker",
                description: "Ensure you're staying hydrated by logging your daily water intake."
              },
              {
                title: "Meals Calculator",
                description: "Plan nutritious meals based on your dietary needs and health goals."
              },
              {
                title: "Medicine Info",
                description: "Stay informed about your prescriptions and dosages to manage your health effectively."
              },
              {
                title: "Exercise Library",
                description: "Explore a variety of exercises tailored to your fitness level and preferences."
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-24 py-8 text-center text-sm text-gray-500 bg-white border-t">
        &copy; 2025 HealthPlus. All rights reserved.
      </footer>
    </div>
  );
}
