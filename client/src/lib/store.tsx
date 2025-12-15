import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// --- Types ---

export interface Stage {
  id: string;
  name: string;
  description: string;
}

export interface Method {
  id: string;
  name: string;
  purpose: string;
  stages: Stage[];
  toneGuidelines: string;
  boundaries: string;
  targetAudience: string;
}

export interface DayContent {
  dayNumber: number;
  title: string;
  coreMessage: string;
  task: string;
  reflectionPrompt: string;
  chatContext: string;
}

export interface Journey {
  id: string;
  methodId: string;
  name: string; // usually derived from method or onboarding
  status: "draft" | "published";
  days: DayContent[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Participant {
  id: string;
  journeyId: string;
  name: string;
  email: string;
  startDate: string;
  currentDay: number; // 1-7
  completedDays: number[]; // array of day numbers
  chatHistory: Record<number, ChatMessage[]>; // map day number to messages
}

// --- Store Context ---

interface StoreContextType {
  // Method
  method: Method | null;
  updateMethod: (updates: Partial<Method>) => void;
  
  // Journeys
  journeys: Journey[];
  createJourney: (onboardingData: any) => Promise<string>; // returns journey ID
  getJourney: (id: string) => Journey | undefined;
  updateJourneyDay: (journeyId: string, dayNumber: number, updates: Partial<DayContent>) => void;
  publishJourney: (id: string) => void;

  // Participants
  participants: Participant[];
  createParticipant: (journeyId: string, name: string, email: string) => string; // returns token/id
  getParticipant: (id: string) => Participant | undefined;
  completeDay: (participantId: string, dayNumber: number) => void;
  addChatMessage: (participantId: string, dayNumber: number, message: Omit<ChatMessage, "id" | "timestamp">) => void;
  
  // Dashboard
  stats: {
    totalPurchases: number;
    activeParticipants: number;
    completionRate: number;
  };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};

// --- Provider ---

const INITIAL_METHOD: Method = {
  id: "method-1",
  name: "The Clarity Protocol",
  purpose: "To help burned-out creatives rediscover their spark.",
  stages: [
    { id: "s1", name: "Decompression", description: "Letting go of the noise." },
    { id: "s2", name: "Realignment", description: "Finding true north." },
    { id: "s3", name: "Activation", description: "Taking the first step." },
  ],
  toneGuidelines: "Empathetic, firm but kind, concise.",
  boundaries: "Do not give medical advice. Do not act as a therapist.",
  targetAudience: "Mid-career designers and writers.",
};

const MOCK_JOURNEY: Journey = {
  id: "journey-1",
  methodId: "method-1",
  name: "7 Days to Creative Clarity",
  status: "published",
  createdAt: new Date().toISOString(),
  days: Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    title: `Day ${i + 1}: ${["The Pause", "The Audit", "The Vision", "The Blocks", "The Plan", "The Action", "The Reflection"][i]}`,
    coreMessage: "Today is about stopping the momentum of the wrong things.",
    task: "Spend 15 minutes doing absolutely nothing. No phone, no music.",
    reflectionPrompt: "What was the hardest part of sitting still?",
    chatContext: "Guide the user to understand why silence is difficult.",
  })),
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or use defaults
  const [method, setMethodState] = useState<Method | null>(() => {
    const saved = localStorage.getItem("flow83_method");
    return saved ? JSON.parse(saved) : INITIAL_METHOD;
  });

  const [journeys, setJourneys] = useState<Journey[]>(() => {
    const saved = localStorage.getItem("flow83_journeys");
    return saved ? JSON.parse(saved) : [MOCK_JOURNEY];
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem("flow83_participants");
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem("flow83_method", JSON.stringify(method)), [method]);
  useEffect(() => localStorage.setItem("flow83_journeys", JSON.stringify(journeys)), [journeys]);
  useEffect(() => localStorage.setItem("flow83_participants", JSON.stringify(participants)), [participants]);

  // Actions
  const updateMethod = (updates: Partial<Method>) => {
    setMethodState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const createJourney = async (onboardingData: any) => {
    // Simulate AI Generation Delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newJourney: Journey = {
      id: uuidv4(),
      methodId: method?.id || "unknown",
      name: `${method?.name || "New"} Journey`,
      status: "draft",
      createdAt: new Date().toISOString(),
      days: Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}: Generated Title`,
        coreMessage: `Core message based on ${onboardingData.transformationGoal}...`,
        task: "Generated task...",
        reflectionPrompt: "Generated reflection...",
        chatContext: `Context derived from ${onboardingData.tone}...`,
      })),
    };
    
    setJourneys(prev => [...prev, newJourney]);
    return newJourney.id;
  };

  const getJourney = (id: string) => journeys.find(j => j.id === id);

  const updateJourneyDay = (journeyId: string, dayNumber: number, updates: Partial<DayContent>) => {
    setJourneys(prev => prev.map(j => {
      if (j.id !== journeyId) return j;
      return {
        ...j,
        days: j.days.map(d => d.dayNumber === dayNumber ? { ...d, ...updates } : d)
      };
    }));
  };

  const publishJourney = (id: string) => {
    setJourneys(prev => prev.map(j => j.id === id ? { ...j, status: "published" } : j));
  };

  const createParticipant = (journeyId: string, name: string, email: string) => {
    const id = uuidv4();
    const newParticipant: Participant = {
      id,
      journeyId,
      name,
      email,
      startDate: new Date().toISOString(),
      currentDay: 1,
      completedDays: [],
      chatHistory: {},
    };
    setParticipants(prev => [...prev, newParticipant]);
    return id;
  };

  const getParticipant = (id: string) => participants.find(p => p.id === id);

  const completeDay = (participantId: string, dayNumber: number) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== participantId) return p;
      if (p.completedDays.includes(dayNumber)) return p;
      
      const completedDays = [...p.completedDays, dayNumber];
      // Logic for unlocking next day would go here (or be time based)
      // For MVP demo, we'll auto-advance current day if it was the current day
      let currentDay = p.currentDay;
      if (dayNumber === currentDay && currentDay < 7) {
        currentDay++;
      }
      
      return { ...p, completedDays, currentDay };
    }));
  };

  const addChatMessage = (participantId: string, dayNumber: number, message: Omit<ChatMessage, "id" | "timestamp">) => {
    setParticipants(prev => prev.map(p => {
      if (p.id !== participantId) return p;
      
      const newMessage: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...message
      };

      const dayHistory = p.chatHistory[dayNumber] || [];
      
      return {
        ...p,
        chatHistory: {
          ...p.chatHistory,
          [dayNumber]: [...dayHistory, newMessage]
        }
      };
    }));
  };

  const stats = {
    totalPurchases: participants.length + 124, // Mock base
    activeParticipants: participants.filter(p => p.completedDays.length < 7).length + 42,
    completionRate: 83,
  };

  return (
    <StoreContext.Provider value={{
      method,
      updateMethod,
      journeys,
      createJourney,
      getJourney,
      updateJourneyDay,
      publishJourney,
      participants,
      createParticipant,
      getParticipant,
      completeDay,
      addChatMessage,
      stats
    }}>
      {children}
    </StoreContext.Provider>
  );
};
