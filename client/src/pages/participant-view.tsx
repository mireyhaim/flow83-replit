import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { chatApi } from "@/lib/api";
import type { Journey, JourneyStep, JourneyBlock, Participant, JourneyMessage } from "@shared/schema";

interface JourneyWithSteps extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
}

export default function ParticipantView() {
  const [, params] = useRoute("/p/:token");
  const tokenFromRoute = params?.token;
  const queryClient = useQueryClient();
  
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
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

  const currentDay = participant?.currentDay ?? 1;
  const sortedSteps = [...(journey?.steps || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const currentStep = sortedSteps.find(s => s.dayNumber === currentDay);
  const totalDays = sortedSteps.length || journey?.duration || 7;
  const isCompleted = currentDay > totalDays;

  const { data: messages = [], isLoading: messagesLoading } = useQuery<JourneyMessage[]>({
    queryKey: ["messages", participant?.id, currentStep?.id],
    queryFn: async () => {
      if (!participant?.id || !currentStep?.id) return [];
      const msgs = await chatApi.startDay(participant.id, currentStep.id);
      return msgs;
    },
    enabled: !!participant?.id && !!currentStep?.id && !isCompleted,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!participant?.id || !currentStep?.id) throw new Error("Missing participant or step");
      return chatApi.sendMessage(participant.id, currentStep.id, content);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JourneyMessage[]>(
        ["messages", participant?.id, currentStep?.id],
        (old = []) => [...old, data.userMessage, data.botMessage]
      );
    },
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
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    queryClient.setQueryData<JourneyMessage[]>(
      ["messages", participant?.id, currentStep?.id],
      (old = []) => [...old, {
        id: "temp-" + Date.now(),
        participantId: participant!.id,
        stepId: currentStep!.id,
        role: "user",
        content,
        createdAt: new Date(),
      }]
    );

    try {
      await sendMessageMutation.mutateAsync(content);
    } finally {
      setIsSending(false);
    }
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
          <h1 className="text-2xl font-serif font-bold mb-2">המסע הושלם!</h1>
          <p className="text-muted-foreground mb-6">
            ברכות על השלמת "{journey.name}". המסע הטרנספורמטיבי שלך הושלם.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">חזרה לדף הבית</Button>
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

        <header className="pt-12 pb-3 px-4 bg-white border-b sticky top-0 z-40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                F
              </div>
              <span className="font-semibold text-sm truncate max-w-[140px]">{journey.name}</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground bg-neutral-100 px-2 py-1 rounded-full" data-testid="text-day-progress">
              יום {currentDay} מתוך {totalDays}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-100">
            <h2 className="font-serif font-bold text-base text-neutral-800" data-testid="text-step-title">
              {currentStep?.title || `יום ${currentDay}`}
            </h2>
            {currentStep?.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {currentStep.description}
              </p>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50" ref={scrollRef}>
          {messagesLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          )}
          
          <AnimatePresence mode="popLayout">
            {messages.filter(m => !m.id.startsWith("temp-")).map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index === messages.length - 1 ? 0.1 : 0 }}
                className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white ml-auto rounded-br-sm shadow-md" 
                    : "bg-white border border-neutral-200 mr-auto rounded-bl-sm shadow-sm"
                )}
                data-testid={`chat-message-${msg.role}-${msg.id}`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-muted-foreground text-sm mr-auto"
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-3 bg-white border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <Input 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder="כתבי את התגובה שלך..."
               className="rounded-full bg-neutral-100 border-none focus-visible:ring-2 focus-visible:ring-violet-300 text-right"
               dir="rtl"
               disabled={isSending}
               data-testid="input-chat"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md"
              disabled={isSending || !inputValue.trim()}
              data-testid="button-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="p-3 bg-white border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            disabled={currentDay <= 1}
            onClick={() => {}}
            data-testid="button-prev-day"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            יום קודם
          </Button>
          
          <Button 
            size="sm"
            onClick={handleCompleteDay}
            disabled={completeDayMutation.isPending || messages.length < 2}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full px-4 shadow-md"
            data-testid="button-complete-day"
          >
            {completeDayMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 ml-1" />
                סיום היום
              </>
            )}
          </Button>
          
          <div className="w-20" />
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
