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
  Home, Settings, LogOut, User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { chatApi } from "@/lib/api";
import type { Journey, JourneyStep, JourneyBlock, Participant, JourneyMessage, User } from "@shared/schema";

interface JourneyWithSteps extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
  mentor?: User | null;
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

  // Get current user info
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/user");
      return res.json();
    },
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

  // Helper to get mentor display name
  const mentorName = journey?.mentor?.firstName 
    ? `${journey.mentor.firstName}${journey.mentor.lastName ? ' ' + journey.mentor.lastName : ''}`
    : "Your Mentor";
  
  const mentorImage = journey?.mentor?.profileImageUrl;
  
  // Helper to get user display name
  const userName = currentUser?.firstName || "You";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Flow Available</h2>
          <p className="text-gray-500 mb-4">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!journey || !participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Flow not found</p>
          <Link href="/dashboard">
            <Button className="bg-violet-600 hover:bg-violet-700">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flow Complete!</h1>
          <p className="text-gray-500 mb-6">
            Congratulations on completing "{journey.name}"
          </p>
          
          <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600">{totalDays}</div>
                <div className="text-xs text-gray-500">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{xpPoints + 100}</div>
                <div className="text-xs text-gray-500">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{totalDays}</div>
                <div className="text-xs text-gray-500">Streak</div>
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
    <div className="min-h-screen bg-stone-100 flex">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Day Complete!</h2>
              <p className="text-emerald-600 font-semibold">+100 XP</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-stone-50 border-r border-stone-200 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-lg lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header - Mentor info */}
        <div className="p-4 border-b border-stone-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mentorImage ? (
                <img 
                  src={mentorImage} 
                  alt={mentorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {mentorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-amber-600 font-medium">Your Guide</p>
                <h1 className="font-bold text-stone-800 text-sm">{mentorName}</h1>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Journey name */}
        <div className="p-4 border-b border-stone-200">
          <h2 className="font-semibold text-stone-800 text-sm">{journey.name}</h2>
          <p className="text-xs text-stone-500 mt-1">Day {currentDay} of {totalDays}</p>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-500">Your Progress</span>
            <span className="text-xs font-bold text-amber-600">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-stone-200" />
        </div>

        {/* Days navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-stone-400 uppercase tracking-wider mb-3 px-2">Your Journey</div>
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
                    isCurrent && "bg-amber-50 border border-amber-200",
                    isPast && "opacity-70 hover:opacity-100 hover:bg-stone-100",
                    isFuture && "opacity-40 cursor-not-allowed"
                  )}
                  data-testid={`sidebar-day-${step.dayNumber}`}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isPast && "bg-emerald-100 text-emerald-600",
                    isCurrent && "bg-amber-500 text-white",
                    isFuture && "bg-stone-200 text-stone-400"
                  )}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.dayNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-stone-800" : "text-stone-600"
                    )}>
                      {step.title || `Day ${step.dayNumber}`}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-amber-600">In progress</div>
                    )}
                    {isPast && (
                      <div className="text-xs text-emerald-600">Completed</div>
                    )}
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-stone-200">
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-stone-600 hover:text-stone-900 hover:bg-stone-200"
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
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-stone-200 flex items-center justify-between px-4 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-stone-500" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-stone-800" data-testid="text-step-title">
                {currentStep?.title || `Day ${currentDay}`}
              </h2>
              <p className="text-xs text-stone-500" data-testid="text-day-progress">
                Day {currentDay} of {totalDays}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-stone-500">
              Chatting with <span className="font-medium text-amber-600">{mentorName}</span>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {/* Welcome message */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 mb-6">
              <div className="flex items-start gap-4">
                {mentorImage ? (
                  <img 
                    src={mentorImage} 
                    alt={mentorName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-300 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                    {mentorName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Day {currentDay}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-800 mb-1">
                    {currentStep?.title || `Welcome to Day ${currentDay}`}
                  </h3>
                  {currentStep?.goal && (
                    <p className="text-sm text-stone-600">
                      {currentStep.goal}
                    </p>
                  )}
                </div>
              </div>
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
                    <div className="shrink-0">
                      {mentorImage ? (
                        <img 
                          src={mentorImage} 
                          alt={mentorName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {mentorName.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[70%]",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    <div className={cn(
                      "text-xs font-medium mb-1",
                      msg.role === "user" ? "text-amber-700" : "text-amber-600"
                    )}>
                      {msg.role === "user" ? userName : mentorName}
                    </div>
                    <div 
                      className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === "user" 
                          ? "bg-amber-100 text-amber-900 rounded-br-sm border border-amber-200" 
                          : "bg-white text-stone-700 border border-stone-200 rounded-bl-sm shadow-sm"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm">
                      {userName.charAt(0)}
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
                <div className="shrink-0">
                  {mentorImage ? (
                    <img 
                      src={mentorImage} 
                      alt={mentorName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium mb-1 text-amber-600">{mentorName}</div>
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm p-4 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-stone-200 p-4 bg-stone-50/80 backdrop-blur-sm">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 relative">
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full rounded-xl bg-white border-stone-300 text-stone-900 placeholder:text-stone-400 focus-visible:ring-amber-500 pr-12 py-6"
                  disabled={isSending}
                  data-testid="input-chat"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 hover:bg-amber-600 shadow-lg"
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
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-lg text-white"
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
