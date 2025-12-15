import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { Journey, JourneyStep, JourneyBlock, Participant } from "@shared/schema";

interface JourneyWithSteps extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
}

export default function ParticipantView() {
  const [, params] = useRoute("/p/:token");
  const tokenFromRoute = params?.token;
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"content" | "chat">("content");
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allJourneys } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
    queryFn: () => fetch("/api/journeys").then(res => res.json()),
    enabled: !tokenFromRoute,
  });

  const publishedJourneys = allJourneys?.filter(j => j.status === "published") || [];
  const journeyId = tokenFromRoute || publishedJourneys[0]?.id;

  const { data: journey, isLoading: journeyLoading } = useQuery<JourneyWithSteps>({
    queryKey: ["/api/journeys", journeyId, "full"],
    queryFn: () => fetch(`/api/journeys/${journeyId}/full`).then(res => res.json()),
    enabled: !!journeyId,
  });

  const { data: participant, isLoading: participantLoading } = useQuery<Participant>({
    queryKey: ["/api/participants/journey", journeyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/participants/journey/${journeyId}`);
      return res.json();
    },
    enabled: !!journeyId,
  });

  const completeDayMutation = useMutation({
    mutationFn: async () => {
      if (!participant || !journey) return;
      const res = await apiRequest("POST", `/api/participants/${participant.id}/complete-day`, {
        dayNumber: participant.currentDay,
        journeyId: journey.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants/journey", journeyId] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  if (!journeyId) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">No Journey Available</h2>
          <p className="text-muted-foreground mb-4">
            {!tokenFromRoute 
              ? "No published journeys are available yet. Check back soon!" 
              : "This journey could not be found."}
          </p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (journeyLoading || participantLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Loading your journey...</div>
      </div>
    );
  }

  if (!journey || !participant) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Journey not found</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDay = participant.currentDay ?? 1;
  const sortedSteps = [...(journey.steps || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const currentStep = sortedSteps.find(s => s.dayNumber === currentDay);
  const totalDays = sortedSteps.length || journey.duration || 7;
  const isCompleted = currentDay > totalDays;
  const isDayCompleted = currentDay > (currentStep?.dayNumber ?? 0);

  const textBlocks = currentStep?.blocks?.filter(b => b.type === "text") || [];
  const questionBlocks = currentStep?.blocks?.filter(b => b.type === "question") || [];
  const taskBlocks = currentStep?.blocks?.filter(b => b.type === "task") || [];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: inputValue,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `Thank you for sharing that. How does this reflection connect to "${currentStep?.title}"? Take a moment to explore that connection. (AI coach coming soon)`,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleCompleteDay = () => {
    completeDayMutation.mutate();
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold mb-2">Journey Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Congratulations on completing "{journey.name}". Your transformation journey is complete.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-neutral-900 relative flex flex-col">
        <div className="absolute top-0 w-full h-8 bg-neutral-900 z-50 flex justify-center">
           <div className="w-1/3 h-5 bg-black rounded-b-xl"></div>
        </div>

        <header className="pt-12 pb-4 px-6 bg-white border-b flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
               F83
             </div>
             <span className="font-semibold text-sm truncate max-w-[120px]">{journey.name}</span>
           </div>
           <div className="text-xs font-medium text-muted-foreground" data-testid="text-day-progress">
             Day {currentDay} of {totalDays}
           </div>
        </header>

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
                 <h1 className="text-2xl font-serif font-bold mb-2" data-testid="text-step-title">
                   {currentStep?.title || `Day ${currentDay}`}
                 </h1>
                 {currentStep?.description && (
                   <p className="text-lg text-muted-foreground mb-8 italic font-serif">
                     "{currentStep.description}"
                   </p>
                 )}
                 
                 <div className="space-y-6">
                   {textBlocks.map((block) => (
                     <div key={block.id} className="prose prose-sm">
                       <p className="leading-relaxed">
                         {typeof block.content === 'object' && block.content !== null && 'text' in block.content 
                           ? String((block.content as { text: string }).text)
                           : String(block.content)}
                       </p>
                     </div>
                   ))}

                   {taskBlocks.length > 0 && (
                     <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                       <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-3">Today's Task</h3>
                       {taskBlocks.map((block) => (
                         <p key={block.id} className="leading-relaxed">
                           {typeof block.content === 'object' && block.content !== null && 'text' in block.content 
                             ? String((block.content as { text: string }).text)
                             : String(block.content)}
                         </p>
                       ))}
                     </div>
                   )}

                   {questionBlocks.length > 0 && (
                     <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                       <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-3">Reflection</h3>
                       {questionBlocks.map((block) => (
                         <p key={block.id} className="leading-relaxed text-sm mb-4">
                           {typeof block.content === 'object' && block.content !== null && 'text' in block.content 
                             ? String((block.content as { text: string }).text)
                             : String(block.content)}
                         </p>
                       ))}
                       <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => setActiveTab("chat")}
                          data-testid="button-reflect"
                        >
                          Reflect with Guide
                        </Button>
                     </div>
                   )}

                   {textBlocks.length === 0 && taskBlocks.length === 0 && questionBlocks.length === 0 && (
                     <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-center text-muted-foreground">
                       <p>No content for this day yet.</p>
                       <p className="text-sm mt-2">The mentor is still creating this step.</p>
                     </div>
                   )}
                 </div>

                 <Button 
                   className="w-full mt-12 mb-8 py-6 text-lg rounded-xl" 
                   onClick={handleCompleteDay}
                   disabled={completeDayMutation.isPending}
                   data-testid="button-complete-day"
                 >
                   {completeDayMutation.isPending ? "Completing..." : "Complete Day"} 
                   <CheckCircle2 className="ml-2" />
                 </Button>
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
                       data-testid={`chat-message-${msg.role}-${msg.id}`}
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
                        data-testid="input-chat"
                     />
                     <Button 
                       type="submit" 
                       size="icon" 
                       className="rounded-full shrink-0"
                       data-testid="button-send"
                     >
                       <Send className="h-4 w-4" />
                     </Button>
                   </form>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="h-16 bg-white border-t grid grid-cols-2">
          <button 
            onClick={() => setActiveTab("content")}
            className={cn("flex flex-col items-center justify-center gap-1 transition-colors", activeTab === "content" ? "text-neutral-900" : "text-neutral-400")}
            data-testid="tab-journey"
          >
            <BookOpenIcon active={activeTab === "content"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Journey</span>
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={cn("flex flex-col items-center justify-center gap-1 transition-colors", activeTab === "chat" ? "text-neutral-900" : "text-neutral-400")}
            data-testid="tab-guide"
          >
            <ChatIcon active={activeTab === "chat"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Guide</span>
          </button>
        </div>
        
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-900/20 rounded-full"></div>
      </div>
      
      <div className="fixed bottom-8 right-8 text-neutral-400 text-sm hidden lg:block max-w-xs text-right">
        <p>You are viewing the <strong>Participant Mobile Experience</strong>.</p>
        <p className="mt-2">In the real app, this runs on the user's phone.</p>
        <Link href="/dashboard" className="text-neutral-900 underline mt-2 block">Back to Mentor OS</Link>
      </div>
    </div>
  );
}

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
