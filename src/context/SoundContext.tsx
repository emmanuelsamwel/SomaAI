import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playSound: (type: 'click' | 'success' | 'delete' | 'notification' | 'pop') => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const SOUND_URLS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  delete: 'https://assets.mixkit.co/active_storage/sfx/256/256-preview.mp3',
  notification: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('sound_muted');
    return saved ? JSON.parse(saved) : false;
  });

  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    const elements: Record<string, HTMLAudioElement> = {};
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      elements[key] = audio;
    });
    setAudioElements(elements);
  }, []);

  useEffect(() => {
    localStorage.setItem('sound_muted', JSON.stringify(isMuted));
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => !prev);
  }, []);

  const playSound = useCallback((type: keyof typeof SOUND_URLS) => {
    if (isMuted) return;
    
    const audio = audioElements[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.warn('Audio play failed:', err));
    }
  }, [isMuted, audioElements]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
