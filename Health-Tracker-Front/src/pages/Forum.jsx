import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdAttachFile, MdKeyboardBackspace, MdDarkMode, MdLightMode, MdEdit, MdDelete } from "react-icons/md";
import * as signalR from "@microsoft/signalr";

const API_URL = "https://localhost:7094";
const FRONTEND_URL = "http://localhost:5174";

const Forum = ({ userId }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFile, setEditFile] = useState(null);
  const postsEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_URL}/api/forum/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch forum posts: ${response.status}`);
        }

        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPosts();

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    newConnection.onclose((err) => console.error("Connection closed:", err));

    newConnection
      .start()
      .then(() => {
        console.log("Connected to forum hub:", newConnection.state);
        setConnection(newConnection);
      })
      .catch((err) => {
        console.error("Connection failed:", err);
        setError("Failed to connect to the forum. Please try again later.");
      });

    newConnection.on("ReceiveForumPost", (post) => {
      console.log("Received post:", post);
      setPosts((prev) => {
        if (!prev.some((p) => p.id === post.id)) {
          return [...prev, post];
        }
        return prev;
      });
    });

    return () => {
      if (newConnection) {
        newConnection.stop().then(() => console.log("Connection stopped"));
      }
    };
  }, [userId, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setSelectedFile(file);
    } else {
      alert("Please select an image or PDF file.");
      e.target.value = null;
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      setEditFile(file);
    } else {
      alert("Please select an image or PDF file.");
      e.target.value = null;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const triggerEditFileInput = () => {
    editFileInputRef.current.click();
  };

  const submitPost = async () => {
    if (newPost.trim() === "" && !selectedFile) {
      setError("Please enter a message or attach a file.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found.");
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("content", newPost || "");
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(`${API_URL}/api/forum/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit post: ${response.status} - ${errorText}`);
      }

      const postedData = await response.json();
      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("SendForumPost", userId, newPost || "", postedData.fileUrl);
      } else {
        setPosts((prev) => [...prev, postedData]);
      }

      setNewPost("");
      setSelectedFile(null);
      fileInputRef.current.value = null;
      setError(null);
    } catch (error) {
      console.error("Error submitting post:", error.message);
      setError("Failed to submit post: " + error.message);
    }
  };

  const editPost = async (postId) => {
    if (editContent.trim() === "" && !editFile && !posts.find((p) => p.id === postId).fileUrl) {
      setError("Please enter content or attach a file.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("content", editContent);
      if (editFile) {
        formData.append("file", editFile);
      }

      const response = await fetch(`${API_URL}/api/forum/posts/${postId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update post: ${response.status} - ${errorText}`);
      }

      const updatedPost = await response.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? updatedPost : p))
      );

      setEditingPostId(null);
      setEditContent("");
      setEditFile(null);
      editFileInputRef.current.value = null;
      setError(null);
    } catch (error) {
      console.error("Error updating post:", error.message);
      setError("Failed to update post: " + error.message);
    }
  };

  const deletePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/forum/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete post: ${response.status} - ${errorText}`);
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setError(null);
    } catch (error) {
      console.error("Error deleting post:", error.message);
      setError("Failed to delete post: " + error.message);
    }
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditFile(null);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditContent("");
    setEditFile(null);
    editFileInputRef.current.value = null;
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    postsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <h2 className="text-lg font-semibold">Health Community Forum</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-800'} hover:bg-opacity-80 transition`}
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet. Be the first to share!</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {post.userName[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{post.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  {post.userId === userId && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(post)}
                        className="p-1 text-gray-500 hover:text-indigo-500 transition"
                        title="Edit Post"
                      >
                        <MdEdit size={20} />
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-1 text-gray-500 hover:text-red-500 transition"
                        title="Delete Post"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  )}
                </div>
                {editingPostId === post.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={`w-full p-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
                      placeholder="Edit your post..."
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={triggerEditFileInput}
                        className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${editFile ? 'text-indigo-500' : 'text-gray-500'} hover:bg-opacity-80 transition`}
                        title="Replace File"
                      >
                        <MdAttachFile size={20} />
                      </button>
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={handleEditFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      <button
                        onClick={() => editPost(post.id)}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                    {editFile && <p className="text-sm text-gray-500">Selected: {editFile.name}</p>}
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-2">{post.content}</p>
                    {post.fileUrl && (
                      <div>
                        {post.fileUrl.endsWith(".pdf") ? (
                          <a
                            href={post.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          <img
                            src={post.fileUrl}
                            alt="Post attachment"
                            className="max-w-full h-auto rounded-md mt-2"
                            onError={(e) => console.error("Failed to load image:", post.fileUrl)}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <div ref={postsEndRef}></div>
          </div>
        )}
      </main>

      {/* Footer/Input Area */}
      <footer className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-inner`}>
        <div className="flex items-center space-x-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something with the community..."
            className={`flex-1 p-3 rounded-full border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
            onKeyPress={(e) => {
              if (e.key === "Enter") submitPost();
            }}
          />
          <button
            onClick={triggerFileInput}
            className={`w-10 h-10 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${selectedFile ? 'text-indigo-500' : 'text-gray-500'} hover:bg-opacity-80 transition`}
            title="Attach a file"
          >
            <MdAttachFile size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <button
            onClick={submitPost}
            className="w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
          >
            <span className="text-xl">➤</span>
          </button>
        </div>
        {selectedFile && <p className="text-sm text-gray-500 mt-2 text-center">Selected: {selectedFile.name}</p>}
      </footer>
    </div>
  );
};

export default Forum;
