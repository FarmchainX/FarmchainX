import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

function Chatbot({ role = 'CUSTOMER' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! 👋 I\'m here to help. What can I assist you with today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const messageIdRef = useRef(2); // Track next message ID

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    // Add user message with incremented ID
    const userMessage = {
      id: messageIdRef.current++,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/chatbot/message', {
        message: messageText,
        role: role,
      });

      const botMessage = {
        id: messageIdRef.current++,
        text: response.data.reply,
        sender: 'bot',
        suggestions: response.data.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: messageIdRef.current++,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          title="Open Chat"
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold">FarmchainX Assistant</h3>
                <p className="text-xs text-emerald-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-emerald-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          >
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-none'
                      : 'bg-white text-slate-900 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Suggestions */}
            {messages.length > 0 &&
              messages[messages.length - 1].sender === 'bot' &&
              messages[messages.length - 1].suggestions && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-500 px-2">Quick suggestions:</p>
                  <div className="space-y-2">
                    {messages[messages.length - 1].suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left text-xs bg-white border border-slate-200 rounded-lg p-2 hover:bg-emerald-50 hover:border-emerald-300 transition truncate"
                      >
                        ✓ {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 rounded-lg rounded-bl-none border border-slate-200 px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your question..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite;
        }
        .delay-100 {
          animation-delay: 0.2s;
        }
        .delay-200 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}

export default Chatbot;


