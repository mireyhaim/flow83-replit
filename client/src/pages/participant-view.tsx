import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Send, CheckCircle2, Loader2, 
  Flame, Star, Trophy, Target, Zap, Calendar, MessageCircle,
  Sparkles, Award, TrendingUp, Clock, Menu, X, ChevronRight,
  Home, Settings, LogOut
} from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
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
  const progressPercent = Math.round(((currentDay - 1) / totalDays) * 100);
  const completedDays = currentDay - 1;
  const xpPoints = completedDays * 100;
  const streak = completedDays;

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
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        queryClient.invalidateQueries({ queryKey: ["/api/participants/journey", journeyId] });
      }, 2000);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  if (!journeyId) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Flow Available</h2>
          <p className="text-white/60 mb-4">
            {!tokenFromRoute 
              ? "No published flows are available yet. Check back soon!" 
              : "This flow could not be found."}
          </p>
          <Link href="/dashboard">
            <Button className="bg-violet-600 hover:bg-violet-700">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (journeyLoading || participantLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-white/60">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!journey || !participant) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Flow not found</p>
          <Link href="/dashboard">
            <Button className="bg-violet-600 hover:bg-violet-700">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/30">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <motion.div 
              className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Flow Complete!</h1>
          <p className="text-white/60 mb-6">
            Congratulations on completing "{journey.name}"
          </p>
          
          <div className="bg-[#1a1a2e]/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-400">{totalDays}</div>
                <div className="text-xs text-white/40">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{xpPoints + 100}</div>
                <div className="text-xs text-white/40">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{totalDays}</div>
                <div className="text-xs text-white/40">Streak</div>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f23] flex">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/50">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Day Complete!</h2>
              <p className="text-emerald-400 font-semibold">+100 XP</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-[#0a0a1a] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                F
              </div>
              <div>
                <h1 className="font-bold text-white text-sm truncate max-w-[150px]">{journey.name}</h1>
                <p className="text-xs text-white/40">Day {currentDay} of {totalDays}</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="p-4 border-b border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-white/60">Streak</span>
              </div>
              <span className="text-lg font-bold text-white">{streak}</span>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-white/60">XP</span>
              </div>
              <span className="text-lg font-bold text-white">{xpPoints}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">Progress</span>
            <span className="text-xs font-bold text-violet-400">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/10" />
        </div>

        {/* Days navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-3 px-2">Your Journey</div>
          <div className="space-y-1">
            {sortedSteps.map((step) => {
              const isPast = step.dayNumber < currentDay;
              const isCurrent = step.dayNumber === currentDay;
              const isFuture = step.dayNumber > currentDay;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                    isCurrent && "bg-violet-600/20 border border-violet-500/30",
                    isPast && "opacity-60 hover:opacity-80",
                    isFuture && "opacity-40 cursor-not-allowed"
                  )}
                  data-testid={`sidebar-day-${step.dayNumber}`}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    isPast && "bg-emerald-500/20 text-emerald-400",
                    isCurrent && "bg-violet-600 text-white",
                    isFuture && "bg-white/10 text-white/40"
                  )}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.dayNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-white" : "text-white/60"
                    )}>
                      {step.title || `Day ${step.dayNumber}`}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-violet-400">In progress</div>
                    )}
                    {isPast && (
                      <div className="text-xs text-emerald-400">Completed</div>
                    )}
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-4 h-4 text-violet-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-[#0f0f23]/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white/60" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-white" data-testid="text-step-title">
                {currentStep?.title || `Day ${currentDay}`}
              </h2>
              <p className="text-xs text-white/40" data-testid="text-day-progress">
                Day {currentDay} of {totalDays}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{streak}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">{xpPoints}</span>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {/* Day context card */}
            <div className="bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 rounded-2xl p-5 border border-violet-500/20 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                  {currentDay}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {currentStep?.title || `Day ${currentDay}`}
                  </h3>
                  {currentStep?.goal && (
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                      <Target className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>{currentStep.goal}</span>
                    </div>
                  )}
                  {currentStep?.task && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>{currentStep.task}</span>
                    </div>
                  )}
                  {currentStep?.explanation && (
                    <p className="text-sm text-white/50 mt-3 pt-3 border-t border-white/10">
                      {currentStep.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Achievements section */}
            <div className="flex flex-wrap gap-2 mb-4">
              {completedDays >= 1 && (
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">First Step</span>
                </div>
              )}
              {streak >= 3 && (
                <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">3-Day Streak</span>
                </div>
              )}
              {xpPoints >= 300 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">XP Master</span>
                </div>
              )}
              {completedDays >= Math.floor(totalDays / 2) && (
                <div className="flex items-center gap-2 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-medium text-violet-400">Halfway There</span>
                </div>
              )}
            </div>

            {messagesLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            )}
            
            <AnimatePresence mode="popLayout">
              {messages.filter(m => !m.id.startsWith("temp-")).map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                  data-testid={`chat-message-${msg.role}-${msg.id}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div 
                    className={cn(
                      "max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user" 
                        ? "bg-violet-600 text-white rounded-br-sm" 
                        : "bg-[#1a1a2e] text-white/90 border border-white/5 rounded-bl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">You</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#1a1a2e] border border-white/5 rounded-2xl rounded-bl-sm p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-white/5 p-4 bg-[#0f0f23]/80 backdrop-blur-sm">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 relative">
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-xl bg-[#1a1a2e] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500 pr-12 py-6"
                  disabled={isSending}
                  data-testid="input-chat"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-violet-600 hover:bg-violet-700 shadow-lg"
                  disabled={isSending || !inputValue.trim()}
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            
            {/* Complete day button */}
            {messages.length > 2 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={handleCompleteDay}
                  disabled={completeDayMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 shadow-lg"
                  data-testid="button-complete-day"
                >
                  {completeDayMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Complete Day {currentDay}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
