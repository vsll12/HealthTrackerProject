import React, { useState, useEffect } from "react";
import LineChart from "../../charts/LineChart01";
import { chartAreaGradient } from "../../charts/ChartjsConfig";

import { adjustColorOpacity, getCssVariable } from "../../utils/Utils";

import axios from "axios";

function DashboardCard02() {
  const token = localStorage.getItem("token");

  const [weeklyAverage, setWeeklyAverage] = useState(null);
  const [chartData, setChartData] = useState(null);

  const fetchChartData = async () => {
    try {
      const response = await axios.get(
        "https://localhost:7094/api/WaterIntake/weekly",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const weeklyData = response.data;
  
      const daysOfWeek = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ];
  
      const sortedData = weeklyData.dailySummaries.map((item) => ({
        date: new Date(item.date),
        totalIntake: item.totalIntake,
      }));
  
      sortedData.sort((a, b) => a.date - b.date);

      if (sortedData[0].totalIntake === 0) {
        const zeroIntakeDay = sortedData.shift();
        sortedData.push(zeroIntakeDay);
      }

      const intakeData = sortedData.map((item) => item.totalIntake);

      const formattedData = {
        labels: daysOfWeek, 
        datasets: [
          {
            label: "Daily Water Intake",
            data: intakeData,
            fill: true,
            tension: 0.4,
            backgroundColor: function (context) {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              return chartAreaGradient(ctx, chartArea, [
                {
                  stop: 0,
                  color: adjustColorOpacity(getCssVariable("--color-violet-500"), 0),
                },
                {
                  stop: 1,
                  color: adjustColorOpacity(getCssVariable("--color-violet-500"), 0.2),
                },
              ]);
            },
            borderColor: getCssVariable("--color-violet-500"),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      };

      setChartData(formattedData);
      setWeeklyAverage(weeklyData.weeklyAverage);
  
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Weekly Water Report
          </h2>
        </header>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
          {weeklyAverage ? `${weeklyAverage.toFixed(2)} ML` : "Loading..."}
        </div>
      </div>

      <div className="grow max-sm:max-h-[128px] max-h-[128px]">
        {chartData ? (
          <LineChart data={chartData} width={389} height={128} />
        ) : (
          <p>Loading chart data...</p>
        )}
      </div>
    </div>
  );
}

export default DashboardCard02;