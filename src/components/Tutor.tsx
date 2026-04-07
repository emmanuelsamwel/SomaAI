import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Upload, Languages } from 'lucide-react';
import { getTutorResponse, analyzeNotes, generateQuiz } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ModelViewer } from './ModelViewer';
import { Quiz } from './Quiz';
import { useSound } from '../context/SoundContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  modelType?: 'skeleton' | 'engine' | 'cell' | 'solar_system';
  quizData?: any;
}

export const Tutor: React.FC = () => {
  const { playSound } = useSound();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am SomaAI, your personal learning assistant. What would you like to learn today? You can also upload your notes for me to explain!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleQuickAction = (action: string) => {
    setInput(action);
    // We need to pass the action directly because setInput state update is async
    submitMessage(action);
  };

  const handleQuizRequest = async (topic: string) => {
    setLoading(true);
    playSound('pop');
    try {
      const quiz = await generateQuiz(topic, language);
      if (quiz) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Great! Let's test your knowledge on **${topic}**. Good luck!`,
          quizData: quiz 
        }]);
        playSound('notification');
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't generate a quiz for that topic right now. Let's keep learning!" 
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while generating the quiz.' }]);
    } finally {
      setLoading(false);
    }
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (text.toLowerCase().includes('quiz')) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.quizData);
      const topic = lastAssistantMsg ? lastAssistantMsg.content.split('\n')[0].replace(/[#*]/g, '').trim() : "the current topic";
      handleQuizRequest(topic);
      return;
    }

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    playSound('pop');

    try {
      const response = await getTutorResponse(text, language);
      
      let modelType: Message['modelType'];
      if (text.toLowerCase().includes('skeleton') || response.toLowerCase().includes('skeleton')) modelType = 'skeleton';
      else if (text.toLowerCase().includes('engine') || response.toLowerCase().includes('engine')) modelType = 'engine';
      else if (text.toLowerCase().includes('cell') || response.toLowerCase().includes('cell')) modelType = 'cell';
      else if (text.toLowerCase().includes('solar system') || response.toLowerCase().includes('solar system')) modelType = 'solar_system';

      setMessages(prev => [...prev, { role: 'assistant', content: response, modelType }]);
      playSound('notification');
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => submitMessage(input);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playSound('click');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setMessages(prev => [...prev, { role: 'user', content: `Uploaded notes: ${file.name}` }]);
      setLoading(true);
      try {
        const response = await analyzeNotes(text, language);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        playSound('notification');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const quickActions = [
    "I understand!",
    "Can you explain that again?",
    "Give me another analogy.",
    "Test me with a quiz!"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">SomaAI Tutor</h2>
            <p className="text-xs text-slate-500">Always active • Personalized learning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-slate-400" />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 font-medium cursor-pointer"
          >
            <option>English</option>
            <option>Swahili</option>
            <option>French</option>
            <option>Spanish</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {m.quizData && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4"
                  >
                    <Quiz 
                      data={m.quizData} 
                      onComplete={(score) => {
                        console.log(`Quiz completed with score: ${score}`);
                        // Optionally send a message to AI about the score
                      }}
                      onClose={() => {
                        // Optionally remove the quiz or mark as finished
                      }}
                    />
                  </motion.div>
                )}
                {m.modelType && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4"
                  >
                    <ModelViewer type={m.modelType} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-sm text-slate-500">SomaAI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {!loading && messages.length > 1 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-full text-xs font-bold border border-slate-200 hover:border-indigo-200 transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <label className="p-2 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">
            <Upload size={20} />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.doc,.docx" />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your subjects..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
