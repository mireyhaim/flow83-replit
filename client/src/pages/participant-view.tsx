import React, { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Send, CheckCircle2, ChevronLeft, ChevronRight, Loader2, 
  Flame, Star, Trophy, Target, Zap, Calendar, MessageCircle,
  Sparkles, Award, TrendingUp, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { chatApi } from "@/lib/api";
import type { Journey, JourneyStep, JourneyBlock, Participant, JourneyMessage } from "@shared/schema";

interface JourneyWithSteps extends Journey {
  steps: (JourneyStep & { blocks: JourneyBlock[] })[];
}

type ViewMode = "chat" | "dashboard" | "summary";

export default function ParticipantView() {
  const [, params] = useRoute("/p/:token");
  const tokenFromRoute = params?.token;
  const queryClient = useQueryClient();
  
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
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
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
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

      <div className="w-full max-w-md bg-[#1a1a2e] h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 relative flex flex-col">
        {/* Top status bar */}
        <div className="bg-[#0f0f23] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
              F
            </div>
            <span className="font-semibold text-white text-sm truncate max-w-[120px]">{journey.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{streak}</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{xpPoints}</span>
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="px-4 py-3 bg-[#1a1a2e] border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">Your Progress</span>
            <span className="text-xs font-bold text-violet-400" data-testid="text-day-progress">
              Day {currentDay} of {totalDays}
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-2 bg-white/10" />
            <div className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" 
                 style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            {sortedSteps.map((step, i) => (
              <div 
                key={step.id}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  step.dayNumber < currentDay 
                    ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white" 
                    : step.dayNumber === currentDay 
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white ring-2 ring-violet-400/50 ring-offset-2 ring-offset-[#1a1a2e]" 
                    : "bg-white/10 text-white/40"
                )}
              >
                {step.dayNumber < currentDay ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  step.dayNumber
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex px-4 py-2 gap-2 bg-[#1a1a2e] border-b border-white/5">
          <button
            onClick={() => setViewMode("chat")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5",
              viewMode === "chat" 
                ? "bg-violet-600 text-white" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5",
              viewMode === "summary" 
                ? "bg-violet-600 text-white" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <Target className="w-3.5 h-3.5" />
            Today
          </button>
          <button
            onClick={() => setViewMode("dashboard")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5",
              viewMode === "dashboard" 
                ? "bg-violet-600 text-white" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Stats
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col"
              >
                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
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
                            ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white ml-auto rounded-br-sm shadow-lg" 
                            : "bg-white/10 text-white mr-auto rounded-bl-sm border border-white/5"
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
                      className="flex items-center gap-2 text-white/40 text-sm mr-auto"
                    >
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Chat input */}
                <div className="p-3 bg-[#0f0f23]/50 border-t border-white/5">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your response..."
                      className="rounded-full bg-white/10 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-violet-500"
                      disabled={isSending}
                      data-testid="input-chat"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-full shrink-0 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 shadow-lg"
                      disabled={isSending || !inputValue.trim()}
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {viewMode === "summary" && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto p-4 space-y-4"
              >
                {/* Day header */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-600/30">
                    <span className="text-2xl font-bold text-white">{currentDay}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white" data-testid="text-step-title">
                    {currentStep?.title || `Day ${currentDay}`}
                  </h2>
                  <p className="text-sm text-white/40 mt-1">Today's Focus</p>
                </div>

                {/* Goal card */}
                <div className="bg-gradient-to-br from-violet-600/20 to-violet-600/5 rounded-2xl p-4 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-violet-400">Today's Goal</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {currentStep?.goal || currentStep?.description || "Complete today's activities and reflect on your progress."}
                  </p>
                </div>

                {/* Explanation card */}
                {currentStep?.explanation && (
                  <div className="bg-gradient-to-br from-fuchsia-600/20 to-fuchsia-600/5 rounded-2xl p-4 border border-fuchsia-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-sm font-semibold text-fuchsia-400">Key Insight</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
                      {currentStep.explanation}
                    </p>
                  </div>
                )}

                {/* Task card */}
                {currentStep?.task && (
                  <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Action Step</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {currentStep.task}
                    </p>
                  </div>
                )}

                {/* Quick chat button */}
                <Button 
                  onClick={() => setViewMode("chat")}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Today's Session
                </Button>
              </motion.div>
            )}

            {viewMode === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full overflow-y-auto p-4 space-y-4"
              >
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-violet-600/20 to-violet-600/5 rounded-2xl p-4 border border-violet-500/20">
                    <Calendar className="w-5 h-5 text-violet-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{completedDays}</div>
                    <div className="text-xs text-white/40">Days Completed</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-600/20 to-orange-600/5 rounded-2xl p-4 border border-orange-500/20">
                    <Flame className="w-5 h-5 text-orange-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{streak}</div>
                    <div className="text-xs text-white/40">Day Streak</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 rounded-2xl p-4 border border-yellow-500/20">
                    <Star className="w-5 h-5 text-yellow-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{xpPoints}</div>
                    <div className="text-xs text-white/40">XP Points</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20">
                    <MessageCircle className="w-5 h-5 text-emerald-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{messages.length}</div>
                    <div className="text-xs text-white/40">Messages</div>
                  </div>
                </div>

                {/* Progress overview */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Journey Progress</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white">{progressPercent}%</span>
                  </div>
                  <p className="text-xs text-white/40">
                    {totalDays - completedDays} days remaining
                  </p>
                </div>

                {/* Achievements */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-3">Achievements</h3>
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      completedDays >= 1 
                        ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                        : "bg-white/10"
                    )}>
                      <Zap className={cn("w-6 h-6", completedDays >= 1 ? "text-white" : "text-white/30")} />
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      completedDays >= 3 
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" 
                        : "bg-white/10"
                    )}>
                      <Award className={cn("w-6 h-6", completedDays >= 3 ? "text-white" : "text-white/30")} />
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      completedDays >= 5 
                        ? "bg-gradient-to-br from-orange-500 to-yellow-500" 
                        : "bg-white/10"
                    )}>
                      <Flame className={cn("w-6 h-6", completedDays >= 5 ? "text-white" : "text-white/30")} />
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isCompleted 
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                        : "bg-white/10"
                    )}>
                      <Trophy className={cn("w-6 h-6", isCompleted ? "text-white" : "text-white/30")} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] text-white/40 w-12 text-center">First Step</span>
                    <span className="text-[10px] text-white/40 w-12 text-center">Halfway</span>
                    <span className="text-[10px] text-white/40 w-12 text-center">On Fire</span>
                    <span className="text-[10px] text-white/40 w-12 text-center">Champion</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom action bar */}
        <div className="p-3 bg-[#0f0f23] border-t border-white/5 flex items-center justify-center">
          <Button 
            size="sm"
            onClick={handleCompleteDay}
            disabled={completeDayMutation.isPending || messages.length < 2}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white rounded-full px-6 shadow-lg shadow-emerald-500/30"
            data-testid="button-complete-day"
          >
            {completeDayMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Day {currentDay}
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Mentor info sidebar - desktop only */}
      <div className="fixed bottom-8 right-8 text-white/40 text-sm hidden lg:block max-w-xs text-right">
        <p>You are viewing the <strong className="text-white/60">Participant Experience</strong>.</p>
        <p className="mt-2">This is how your clients will see their flow.</p>
        <Link href="/journeys" className="text-violet-400 hover:text-violet-300 underline mt-2 block">Back to My Flows</Link>
      </div>
    </div>
  );
}
