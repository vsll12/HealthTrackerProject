import { useState, useEffect } from "react";
import { BellRing, X } from "lucide-react";

export default function NotificationSystem() {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true); // Bildirimlerin açık/kapalı durumu

const notifications = [
  "Take a step today!",
  "Don’t forget to drink water, your body needs it!",
  "Move a little, your muscles are waiting!",
  "Eat something healthy today, take care of yourself!",
  "Take a deep breath!",
  "Don’t forget to exercise today!",
  "Do something good for yourself, give your body some rest!",
];

  useEffect(() => {
    const hasLoggedInBefore = localStorage.getItem("hasLoggedInBefore");

    if (!hasLoggedInBefore) {
      setShowNotification(false);
      setTimeout(() => {
        setNotificationMessage("Welcome to Health Tracker!");
        setShowNotification(true);

        setTimeout(() => {
          setShowNotification(false);
        }, 5000); 
      }, 100);
      localStorage.setItem("hasLoggedInBefore", "true");
    }

    if (notificationsEnabled) {
      const notificationInterval = setInterval(() => {
        showRandomNotification();
        console.log("Show notfilication");
      }, 600000);

      return () => clearInterval(notificationInterval);
    }
  }, [notificationsEnabled]); 

  const showRandomNotification = () => {
    setShowNotification(false);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * notifications.length);
      setNotificationMessage(notifications[randomIndex]);
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 5000); 
    }, 100);
  };
  
  return (
    <>
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 transition-opacity duration-300 opacity-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BellRing className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3 w-full">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-900">
                  {notificationMessage}
                </p>
                <button
                  type="button"
                  className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowNotification(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
