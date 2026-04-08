import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Upload, Languages, Target, Plus, Sparkles, Volume2, VolumeX, Download, FileText, Presentation, File as FileIcon, ChevronDown } from 'lucide-react';
import { getTutorResponse, analyzeNotes, generateQuiz, generateStudyPlan, getSpeech } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ModelViewer } from './ModelViewer';
import { Quiz } from './Quiz';
import { useSound } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';
import { db, collection, addDoc } from '../firebase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  modelType?: 'skeleton' | 'engine' | 'cell' | 'solar_system' | 'heart' | 'brain';
  quizData?: any;
  studyPlanData?: any;
}

export const Tutor: React.FC = () => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am SomaAI, your personal learning assistant. What would you like to learn today? You can also upload your notes for me to explain!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const speak = async (text: string) => {
    if (!isVoiceEnabled) return;
    
    try {
      setIsSpeaking(true);
      const base64Audio = await getSpeech(text);
      if (base64Audio) {
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioSrc);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
        }
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(20);
    doc.text("SomaAI Lesson Summary", 20, y);
    y += 15;
    doc.setFontSize(12);

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Student' : 'SomaAI';
      const lines = doc.splitTextToSize(`${role}: ${msg.content}`, 170);
      
      if (y + (lines.length * 7) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(lines, 20, y);
      y += (lines.length * 7) + 5;
    });

    doc.save('SomaAI_Lesson.pdf');
    setShowExportMenu(false);
    playSound('success');
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "SomaAI Lesson Summary",
                bold: true,
                size: 32,
              }),
            ],
          }),
          ...messages.map(msg => new Paragraph({
            children: [
              new TextRun({
                text: `${msg.role === 'user' ? 'Student' : 'SomaAI'}: `,
                bold: true,
              }),
              new TextRun(msg.content),
            ],
            spacing: { before: 200 },
          })),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "SomaAI_Lesson.docx");
    setShowExportMenu(false);
    playSound('success');
  };

  const exportToPPT = () => {
    const pres = new pptxgen();
    
    // Title Slide
    let slide = pres.addSlide();
    slide.addText("SomaAI Lesson Summary", { x: 1, y: 1, w: '80%', h: 1, fontSize: 36, bold: true, align: 'center', color: '363636' });
    slide.addText(`Generated on ${new Date().toLocaleDateString()}`, { x: 1, y: 2.5, w: '80%', h: 0.5, fontSize: 18, align: 'center', color: '666666' });

    // Content Slides
    messages.forEach((msg, idx) => {
      if (idx === 0) return; // Skip initial greeting for brevity or handle it
      let contentSlide = pres.addSlide();
      contentSlide.addText(msg.role === 'user' ? 'Student Question' : 'SomaAI Explanation', { x: 0.5, y: 0.5, w: '90%', h: 0.5, fontSize: 24, bold: true, color: '4F46E5' });
      contentSlide.addText(msg.content, { x: 0.5, y: 1.2, w: '90%', h: '70%', fontSize: 14, color: '333333', align: 'left', valign: 'top' });
    });

    pres.writeFile({ fileName: "SomaAI_Lesson.pptx" });
    setShowExportMenu(false);
    playSound('success');
  };

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

  const handleStudyPlanRequest = async (topic: string) => {
    setLoading(true);
    playSound('pop');
    try {
      const plan = await generateStudyPlan(topic, language);
      if (plan) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've drafted a study plan for **${topic}**. Would you like to add it to your goals?`,
          studyPlanData: plan 
        }]);
        playSound('notification');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while generating the study plan.' }]);
    } finally {
      setLoading(false);
    }
  };

  const addToStudyPlan = async (plan: any) => {
    if (!user) return;
    playSound('success');
    try {
      await addDoc(collection(db, 'studyPlans'), {
        studentUid: user.uid,
        goal: plan.goal,
        targetDate: plan.targetDate,
        tasks: plan.tasks,
        linkedTopics: [],
        completed: false,
        progress: 0
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `✅ Successfully added **${plan.goal}** to your study plans!` 
      }]);
    } catch (error) {
      console.error(error);
    }
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (text.toLowerCase().includes('quiz')) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.quizData && !m.studyPlanData);
      const topic = lastAssistantMsg ? lastAssistantMsg.content.split('\n')[0].replace(/[#*]/g, '').trim() : "the current topic";
      handleQuizRequest(topic);
      return;
    }

    if (text.toLowerCase().includes('study plan') || text.toLowerCase().includes('goal')) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.quizData && !m.studyPlanData);
      const topic = lastAssistantMsg ? lastAssistantMsg.content.split('\n')[0].replace(/[#*]/g, '').trim() : "the current topic";
      handleStudyPlanRequest(topic);
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
      
      // Check for explicit [MODEL:type] tag first
      const modelMatch = response.match(/\[MODEL:(skeleton|engine|cell|solar_system|heart|brain)\]/i);
      if (modelMatch) {
        modelType = modelMatch[1].toLowerCase() as Message['modelType'];
      } else {
        // Fallback to keyword detection
        if (text.toLowerCase().includes('skeleton') || response.toLowerCase().includes('skeleton')) modelType = 'skeleton';
        else if (text.toLowerCase().includes('engine') || response.toLowerCase().includes('engine')) modelType = 'engine';
        else if (text.toLowerCase().includes('cell') || response.toLowerCase().includes('cell')) modelType = 'cell';
        else if (text.toLowerCase().includes('solar system') || response.toLowerCase().includes('solar system')) modelType = 'solar_system';
        else if (text.toLowerCase().includes('heart') || response.toLowerCase().includes('heart')) modelType = 'heart';
        else if (text.toLowerCase().includes('brain') || response.toLowerCase().includes('brain')) modelType = 'brain';
      }

      // Clean up the response text by removing the tag for display
      const displayContent = response.replace(/\[MODEL:.*?\]/g, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: displayContent, modelType }]);
      playSound('notification');
      if (isVoiceEnabled) {
        speak(displayContent);
      }
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
        if (isVoiceEnabled) {
          speak(response);
        }
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
    "Create a study plan for this!",
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
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                playSound('click');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all font-bold text-xs"
              title="Export Lesson"
            >
              <Download size={16} />
              <span>Export</span>
              <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  <button
                    onClick={exportToPDF}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileIcon size={18} className="text-red-500" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={exportToWord}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileText size={18} className="text-blue-500" />
                    <span>Export as Word</span>
                  </button>
                  <button
                    onClick={exportToPPT}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Presentation size={18} className="text-orange-500" />
                    <span>Export as PPT</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              const newState = !isVoiceEnabled;
              setIsVoiceEnabled(newState);
              if (!newState) stopSpeaking();
              playSound('click');
            }}
            className={`p-2 rounded-xl transition-all ${
              isVoiceEnabled 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'bg-slate-100 text-slate-400'
            }`}
            title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
          >
            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
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
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/30">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                m.role === 'user' ? 'bg-white text-slate-600 border border-slate-100' : 'bg-indigo-600 text-white shadow-indigo-100'
              }`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="space-y-4 flex-1">
                <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'text-white prose-invert' : 'text-slate-800'}`}>
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {m.studyPlanData && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-50 space-y-4"
                  >
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Target size={24} />
                      <h3 className="font-black text-lg">{m.studyPlanData.goal}</h3>
                    </div>
                    <div className="space-y-2">
                      {m.studyPlanData.tasks.map((task: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-600 text-sm">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          {task.title}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addToStudyPlan(m.studyPlanData)}
                      className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <Plus size={18} />
                      Add to My Study Plans
                    </button>
                  </motion.div>
                )}
                {m.quizData && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6"
                  >
                    <Quiz 
                      data={m.quizData} 
                      onComplete={(score) => {
                        console.log(`Quiz completed with score: ${score}`);
                      }}
                      onClose={() => {}}
                    />
                  </motion.div>
                )}
                {m.modelType && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 rounded-3xl overflow-hidden border border-slate-200 shadow-xl"
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
            <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-200 rounded-full" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SomaAI is thinking</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {!loading && messages.length > 1 && (
        <div className="px-6 py-3 flex gap-3 overflow-x-auto scrollbar-none bg-white border-t border-slate-50">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="whitespace-nowrap px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl text-xs font-bold border border-slate-100 hover:border-indigo-100 transition-all active:scale-95"
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
