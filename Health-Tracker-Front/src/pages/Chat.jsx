import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useParams, useNavigate } from "react-router-dom";
import { MdDelete, MdKeyboardBackspace, MdDarkMode, MdLightMode } from "react-icons/md";
import { BiSolidMessageAltEdit } from "react-icons/bi";

const API_URL = "https://localhost:7094";

const Chat = ({ userId }) => {
  const { id: friendId } = useParams();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connection, setConnection] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_URL}/api/friends/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch friends: ${response.status}`);
        }

        const data = await response.json();
        setFriends(data);
        setSelectedFriend(data.find((f) => f.id === friendId) || null);
        setError(null);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setError("Failed to load friends. Please try again.");
      }
    };

    fetchFriends();
  }, [userId, friendId, navigate]);

  useEffect(() => {
    if (!selectedFriend || !userId) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/messages/${userId}/${selectedFriend.id}?page=1&pageSize=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const data = await response.json();
        setMessages(
          data.reverse().map((msg) => ({
            id: msg.id,
            senderId: msg.senderId,
            message: msg.content,
            timestamp: msg.timestamp,
            status: msg.status,
          }))
        );
        setError(null);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
      }
    };

    fetchMessages();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("Connected to chat hub:", newConnection.state);
        newConnection.invoke("JoinChat", userId, selectedFriend.id).catch((err) =>
          console.error("Error joining chat:", err)
        );
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error("Connection failed:", err);
        setError("Failed to connect to chat. Please try again later.");
      });

    newConnection.on("ReceiveMessage", (senderId, message, timestamp, status, id) => {
      setMessages((prev) => {
        if (!prev.some((msg) => msg.id === id)) {
          return [...prev, { id, senderId, message, timestamp, status }];
        }
        return prev;
      });
    });

    newConnection.on("MessageUpdated", (messageId, newContent, timestamp) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, message: newContent, timestamp } : msg
        )
      );
    });

    newConnection.on("MessageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    newConnection.on("UserTyping", (typingUserId) => {
      if (typingUserId === selectedFriend.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      if (newConnection) {
        newConnection
          .invoke("LeaveChat", userId, selectedFriend.id)
          .catch((err) => console.error("Error leaving chat:", err));
        newConnection.stop().then(() => console.log("Connection stopped"));
      }
    };
  }, [selectedFriend, userId, navigate]);

  const sendMessage = async () => {
    if (message.trim() === "" || !connection || !selectedFriend) {
      setError("Please enter a message.");
      return;
    }

    try {
      await connection.invoke("SendMessage", userId, selectedFriend.id, message);
      setMessage("");
      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message: " + error.message);
    }
  };

  const handleTyping = async () => {
    if (!connection || !selectedFriend) return;
    try {
      await connection.invoke("NotifyTyping", userId, selectedFriend.id);
    } catch (error) {
      console.error("Error notifying typing:", error);
    }
  };

  const startEditing = (msg) => {
    if (msg.senderId === userId) {
      setEditingMessageId(msg.id);
      setEditedContent(msg.message);
    }
  };

  const updateMessage = async () => {
    if (!connection || !editingMessageId || editedContent.trim() === "") {
      setError("Please enter valid content.");
      return;
    }

    try {
      await connection.invoke("UpdateMessage", editingMessageId, editedContent);
      setEditingMessageId(null);
      setEditedContent("");
      setError(null);
    } catch (error) {
      console.error("Error updating message:", error);
      setError("Failed to update message: " + error.message);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!connection) {
      setError("Not connected to chat hub.");
      return;
    }

    try {
      await connection.invoke("DeleteMessage", messageId);
      setError(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      setError("Failed to delete message: " + error.message);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`flex h-screen ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      {/* Friends Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto md:block hidden">
        <h3 className="text-lg font-bold text-indigo-500 mb-4">Chats</h3>
        {friends.length > 0 ? (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`p-3 cursor-pointer flex items-center rounded-md hover:bg-gray-700 transition ${
                  selectedFriend?.id === friend.id ? "bg-gray-700" : ""
                }`}
              >
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl">
                  {friend.name[0]}
                </div>
                <span className="ml-4 text-sm">{friend.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No friends yet.</p>
        )}
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        <header
          className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-md`}
        >
          <div className="flex items-center">
            {selectedFriend && (
              <>
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl">
                  {selectedFriend.name[0]}
                </div>
                <h2 className="ml-4 text-lg font-semibold">{selectedFriend.name}</h2>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-200 text-gray-800"
              } hover:bg-opacity-80 transition`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
            </button>
            <button
              onClick={goToDashboard}
              className="flex items-center justify-center w-10 h-10 text-white bg-red-500 rounded-full hover:bg-red-600 transition"
              title="Back to Dashboard"
            >
              <MdKeyboardBackspace size={20} />
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center mx-4 mt-4">
            {error}
          </div>
        )}

        {selectedFriend ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === userId ? "justify-end" : "justify-start"
                  } mb-2`}
                >
                  <div
                    className={`p-4 rounded-lg max-w-xs shadow-md ${
                      msg.senderId === userId
                        ? isDarkMode
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-100"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {editingMessageId === msg.id ? (
                      <div>
                        <input
                          type="text"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className={`w-full p-2 rounded-md border ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-gray-100"
                              : "bg-gray-50 border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                        />
                        <div className="flex justify-end mt-2 space-x-2">
                          <button
                            onClick={updateMessage}
                            className="px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          {msg.senderId === userId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditing(msg)}
                                className="text-indigo-400 hover:text-indigo-300 transition"
                                title="Edit Message"
                              >
                                <BiSolidMessageAltEdit size={16} />
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="text-red-400 hover:text-red-300 transition"
                                title="Delete Message"
                              >
                                <MdDelete size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <p className="italic text-gray-500 text-sm">Typing...</p>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <div
              className={`p-4 flex items-center ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } shadow-inner`}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message"
                className={`flex-1 p-3 rounded-full border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-gray-50 border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                onKeyPress={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                className="ml-3 w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
              >
                <span className="text-xl">➤</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-lg">Select a friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
