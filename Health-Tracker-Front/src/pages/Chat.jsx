import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useParams, useNavigate } from "react-router-dom"; 
import { MdDelete } from "react-icons/md";
import { BiSolidMessageAltEdit } from "react-icons/bi";
import { MdKeyboardBackspace } from "react-icons/md";

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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found, redirecting to login...");
          return;
        }

        const response = await fetch(`${API_URL}/api/friends/friends/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setFriends(data);
          setSelectedFriend(data.find((f) => f.id === friendId) || null);
        } else {
          console.error("Failed to fetch friends, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [userId, friendId]);

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

        if (response.ok) {
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
        } else {
          console.error("Failed to fetch messages, status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    newConnection
      .start()
      .then(() => console.log("Connected to chat"))
      .catch((err) => console.error("Connection failed", err));

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
      if (typingUserId !== userId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    setConnection(newConnection);

    return () => newConnection.stop();
  }, [selectedFriend, userId]);

  const sendMessage = async () => {
    if (message.trim() === "" || !connection || !selectedFriend) return;

    try {
      await connection.invoke("SendMessage", userId, selectedFriend.id, message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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
    if (!connection || !editingMessageId || editedContent.trim() === "") return;

    try {
      await connection.invoke("UpdateMessage", editingMessageId, editedContent);
      setEditingMessageId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!connection) return;

    try {
      await connection.invoke("DeleteMessage", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard"); // Adjust this path to match your dashboard route
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-900 font-sans">
      {/* Friends Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold text-teal-500 mb-4">Chats</h3>
        <ul className="space-y-2">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <li
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`p-4 cursor-pointer flex items-center hover:bg-gray-700 ${
                  selectedFriend?.id === friend.id ? "bg-gray-700" : ""
                }`}
              >
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white text-xl">
                  {friend.name[0]}
                </div>
                <span className="ml-4 text-white text-sm">{friend.name}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No friends yet.</p>
          )}
        </ul>
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedFriend ? (
          <>
            <div className="flex items-center justify-between p-4 bg-gray-800 text-white shadow-md sticky top-0 z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white text-xl">
                  {selectedFriend.name[0]}
                </div>
                <h2 className="ml-4 text-lg">{selectedFriend.name}</h2>
              </div>
              <button
                onClick={goToDashboard}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
              >
                <MdKeyboardBackspace />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${
                    msg.senderId === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`bg-${msg.senderId === userId ? "teal-600" : "gray-700"} p-4 rounded-lg max-w-xs`}
                  >
                    {editingMessageId === msg.id ? (
                      <div>
                        <input
                          type="text"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={updateMessage}
                            className="bg-teal-500 text-white px-4 py-2 rounded-lg mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-white">{msg.message}</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          {msg.senderId === userId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditing(msg)}
                                className="text-teal-500"
                              >
                                <BiSolidMessageAltEdit />
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="text-red-500"
                              >
                                <MdDelete />
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

            <div className="bg-gray-800 p-4 flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message"
                className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                className="ml-4 bg-teal-500 text-white rounded-full p-3"
              >
                ➤
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
