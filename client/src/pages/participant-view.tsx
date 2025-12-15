import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, Lock, CheckCircle2, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ParticipantView() {
  const { journeys, createParticipant, getParticipant, completeDay, addChatMessage } = useStore();
  
  // Mock session management for demo
  const [participantId, setParticipantId] = useState<string | null>(() => localStorage.getItem("demo_participant_id"));
  const participant = participantId ? getParticipant(participantId) : undefined;
  
  // Use first published journey for demo
  const journey = journeys.find(j => j.status === "published") || journeys[0];
  const [activeTab, setActiveTab] = useState<"content" | "chat">("content");
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize demo user if needed
  useEffect(() => {
    if (!participantId && journey) {
      const id = createParticipant(journey.id, "Demo User", "demo@example.com");
      localStorage.setItem("demo_participant_id", id);
      setParticipantId(id);
    }
  }, [participantId, journey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [participant?.chatHistory, activeTab]);

  if (!journey || !participant) return <div>Loading...</div>;

  const currentDayContent = journey.days.find(d => d.dayNumber === participant.currentDay);
  const isCompleted = participant.completedDays.includes(participant.currentDay);
  const chatMessages = participant.chatHistory[participant.currentDay] || [];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add User Message
    addChatMessage(participant.id, participant.currentDay, {
      role: "user",
      content: inputValue
    });
    setInputValue("");

    // Simulate AI Response
    setTimeout(() => {
      addChatMessage(participant.id, participant.currentDay, {
        role: "assistant",
        content: `I hear you. Regarding "${currentDayContent?.reflectionPrompt}" - how does that make you feel? (This is a simulated AI response based on the Mentor's persona).`
      });
    }, 1000);
  };

  const handleCompleteDay = () => {
    completeDay(participant.id, participant.currentDay);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      {/* Mobile Simulator Frame */}
      <div className="w-full max-w-md bg-white h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-neutral-900 relative flex flex-col">
        {/* Dynamic Notch / Status Bar */}
        <div className="absolute top-0 w-full h-8 bg-neutral-900 z-50 flex justify-center">
           <div className="w-1/3 h-5 bg-black rounded-b-xl"></div>
        </div>

        {/* Header */}
        <header className="pt-12 pb-4 px-6 bg-white border-b flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
               F83
             </div>
             <span className="font-semibold text-sm">Flow 83</span>
           </div>
           <div className="text-xs font-medium text-muted-foreground">
             Day {participant.currentDay} of 7
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
           <AnimatePresence mode="wait">
             {activeTab === "content" ? (
               <motion.div 
                 key="content"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="h-full overflow-y-auto p-6 pb-24"
               >
                 <h1 className="text-2xl font-serif font-bold mb-2">{currentDayContent?.title}</h1>
                 <p className="text-lg text-muted-foreground mb-8 italic font-serif">"{currentDayContent?.coreMessage}"</p>
                 
                 <div className="space-y-6">
                   <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                     <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-3">Today's Task</h3>
                     <p className="leading-relaxed">{currentDayContent?.task}</p>
                   </div>

                   <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                     <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-3">Reflection</h3>
                     <p className="leading-relaxed text-sm mb-4">{currentDayContent?.reflectionPrompt}</p>
                     <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab("chat")}
                      >
                        Reflect with Guide
                      </Button>
                   </div>
                 </div>

                 {!isCompleted && (
                   <Button className="w-full mt-12 mb-8 py-6 text-lg rounded-xl" onClick={handleCompleteDay}>
                     Complete Day <CheckCircle2 className="ml-2" />
                   </Button>
                 )}
                 
                 {isCompleted && (
                   <div className="mt-12 text-center text-muted-foreground p-4 bg-green-50 text-green-800 rounded-xl">
                     Day Completed. See you tomorrow.
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div 
                 key="chat"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="h-full flex flex-col bg-neutral-50"
               >
                 <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                   {chatMessages.length === 0 && (
                     <div className="text-center text-muted-foreground text-sm mt-10">
                       Start reflecting on today's prompt...
                     </div>
                   )}
                   {chatMessages.map((msg) => (
                     <div 
                       key={msg.id} 
                       className={cn(
                         "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                         msg.role === "user" 
                           ? "bg-neutral-900 text-white ml-auto rounded-tr-none" 
                           : "bg-white border shadow-sm mr-auto rounded-tl-none"
                       )}
                     >
                       {msg.content}
                     </div>
                   ))}
                 </div>
                 <div className="p-4 bg-white border-t">
                   <form 
                     onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                     className="flex gap-2"
                   >
                     <Input 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your reflection..."
                        className="rounded-full bg-neutral-100 border-none focus-visible:ring-1"
                     />
                     <Button type="button" size="icon" className="rounded-full shrink-0" onClick={handleSendMessage}>
                       <Send className="h-4 w-4" />
                     </Button>
                   </form>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <div className="h-16 bg-white border-t grid grid-cols-2">
          <button 
            onClick={() => setActiveTab("content")}
            className={cn("flex flex-col items-center justify-center gap-1 transition-colors", activeTab === "content" ? "text-neutral-900" : "text-neutral-400")}
          >
            <BookOpenIcon active={activeTab === "content"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Journey</span>
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={cn("flex flex-col items-center justify-center gap-1 transition-colors", activeTab === "chat" ? "text-neutral-900" : "text-neutral-400")}
          >
            <ChatIcon active={activeTab === "chat"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Guide</span>
          </button>
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-900/20 rounded-full"></div>
      </div>
      
      {/* Desktop Helper Text */}
      <div className="fixed bottom-8 right-8 text-neutral-400 text-sm hidden lg:block max-w-xs text-right">
        <p>You are viewing the <strong>Participant Mobile Experience</strong>.</p>
        <p className="mt-2">In the real app, this runs on the user's phone.</p>
        <Link href="/dashboard" className="text-neutral-900 underline mt-2 block">Back to Mentor OS</Link>
      </div>
    </div>
  );
}

// Icons
function BookOpenIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
