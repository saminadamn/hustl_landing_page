import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader, Mail } from 'lucide-react';

interface ChatbotSupportProps {
  onClose: () => void;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE = {
  type: 'bot',
  content: "Hi! I'm your Hustl support assistant. How can I help you today?",
  timestamp: new Date()
};

const ChatbotSupport: React.FC<ChatbotSupportProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supportEmail = 'hustlapp@outlook.com';
  const supportMailto = `mailto:${supportEmail}?subject=Support Request from Chatbot`;

  useEffect(() => {
    scrollToBottom();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const normalizedMessage = userMessage.toLowerCase();
    
    // Common responses based on keywords
    if (normalizedMessage.includes('payment') || normalizedMessage.includes('money')) {
      return "Payments on Hustl are processed securely through our platform. We use escrow to hold funds until tasks are completed. For specific payment issues, please email hustlapp@outlook.com.";
    }
    
    if (normalizedMessage.includes('verify') || normalizedMessage.includes('verification')) {
      return "To verify your account, upload your student ID in your profile settings. This helps build trust in our community. The verification process usually takes 24-48 hours.";
    }
    
    if (normalizedMessage.includes('cancel') || normalizedMessage.includes('refund')) {
      return "You can cancel a task before it's accepted without any penalty. Once accepted, you'll need to communicate with the other party through our chat system. For refunds, please contact our support team at hustlapp@outlook.com.";
    }
    
    if (normalizedMessage.includes('safety') || normalizedMessage.includes('emergency')) {
      return "Your safety is our priority. We verify all users, provide in-app chat, and have emergency features. In case of emergency, use the emergency button in the app or contact campus police at (352) 392-1111.";
    }
    
    if (normalizedMessage.includes('contact') || normalizedMessage.includes('support') || normalizedMessage.includes('email')) {
      return "You can reach our support team at hustlapp@outlook.com. For urgent matters, use the emergency features in the app.";
    }
    
    if (normalizedMessage.includes('safewalk') || normalizedMessage.includes('walk') || normalizedMessage.includes('escort')) {
      return "Our SafeWalk feature connects you with verified volunteers who can accompany you while walking on campus. You can request a SafeWalk through the Safety Features section of the app.";
    }

    // Default response for unknown queries
    return "I understand you need help with that. For the most accurate assistance, please email our support team at hustlapp@outlook.com or try rephrasing your question.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const botResponse = await generateBotResponse(userMessage.content);
      const botMessage: Message = {
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: "I'm having trouble responding right now. Please try again or contact our support team at hustlapp@outlook.com.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleContactSupport = () => {
    window.location.href = supportMailto;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-[#0021A5] mr-2" />
            <h2 className="text-xl font-semibold">Hustl Support</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 flex items-start space-x-2 ${
                  message.type === 'user'
                    ? 'bg-[#0021A5] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'bot' && (
                  <Bot className="w-5 h-5 mt-1" />
                )}
                <div>
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {message.type === 'user' && (
                  <User className="w-5 h-5 mt-1" />
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Contact Support Button */}
        <div className="px-4 py-2 border-t border-b bg-blue-50">
          <button
            onClick={handleContactSupport}
            className="w-full flex items-center justify-center text-[#0021A5] hover:text-[#001B8C] py-2 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            <span className="font-medium">Email Support Team</span>
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-lg border-gray-300 focus:border-[#0021A5] focus:ring focus:ring-[#0021A5] focus:ring-opacity-50"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-[#0021A5] text-white p-2 rounded-lg hover:bg-[#001B8C] transition duration-200 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotSupport;