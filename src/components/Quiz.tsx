import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw, Award } from 'lucide-react';
import { useSound } from '../context/SoundContext';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: Question[];
}

interface QuizProps {
  data: QuizData;
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ data, onComplete, onClose }) => {
  const { playSound } = useSound();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    setShowResult(true);
    
    if (index === data.questions[currentQuestion].correctIndex) {
      setScore(prev => prev + 1);
      playSound('notification');
    } else {
      playSound('pop');
    }
  };

  const handleNext = () => {
    if (currentQuestion < data.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
      playSound('click');
    } else {
      setQuizFinished(true);
      onComplete(score);
      playSound('notification');
    }
  };

  if (quizFinished) {
    const percentage = Math.round((score / data.questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award size={48} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Quiz Completed!</h3>
        <p className="text-slate-500 mb-6">You scored {score} out of {data.questions.length} ({percentage}%)</p>
        
        <div className="flex gap-3 justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            Close
          </button>
          <button 
            onClick={() => {
              setCurrentQuestion(0);
              setSelectedOption(null);
              setShowResult(false);
              setScore(0);
              setQuizFinished(false);
              playSound('pop');
            }}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
          >
            <RefreshCcw size={18} /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const question = data.questions[currentQuestion];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
    >
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900">{data.title}</h3>
          <p className="text-xs text-slate-500 font-medium">Question {currentQuestion + 1} of {data.questions.length}</p>
        </div>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-black">
          Score: {score}
        </div>
      </div>

      <div className="p-8 space-y-6">
        <h4 className="text-lg font-bold text-slate-800 leading-tight">
          {question.question}
        </h4>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let statusClass = "bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50";
            if (selectedOption !== null) {
              if (index === question.correctIndex) {
                statusClass = "bg-emerald-100 border-emerald-500 text-emerald-700";
              } else if (index === selectedOption) {
                statusClass = "bg-red-100 border-red-500 text-red-700";
              } else {
                statusClass = "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
              }
            }

            return (
              <button
                key={index}
                disabled={selectedOption !== null}
                onClick={() => handleOptionSelect(index)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all flex justify-between items-center ${statusClass}`}
              >
                <span>{option}</span>
                {selectedOption !== null && index === question.correctIndex && <CheckCircle2 size={20} />}
                {selectedOption !== null && index === selectedOption && index !== question.correctIndex && <XCircle size={20} />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-black text-slate-900 block mb-1">Explanation:</span>
                {question.explanation}
              </p>
              <button
                onClick={handleNext}
                className="mt-4 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {currentQuestion === data.questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
