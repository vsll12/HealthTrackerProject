import { useState, useEffect } from 'react';
import axios from 'axios';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Call the backend API with the user's message
    try {
      const response = await axios.post('https://localhost:7094/api/chat', {
        message: input,
      });

      // Assuming the response has a 'reply' field with the AI's response
      setMessages([
        ...newMessages,
        { sender: 'ai', text: response.data.reply },
      ]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'ai', text: 'Error, please try again!' }]);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Optionally, add a welcome message when the chat is first loaded
    setMessages([{ sender: 'ai', text: 'Hello! How can I help you today?' }]);
  }, []);

  return (
    <div className="ai-chat">
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat;
