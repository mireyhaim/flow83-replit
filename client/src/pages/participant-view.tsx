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

function isAccessToken(token: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(token);
}

export default function ParticipantView() {
  const [, params] = useRoute("/p/:token");
  const tokenFromRoute = params?.token;
  const queryClient = useQueryClient();
  
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [dayReadyForCompletion, setDayReadyForCompletion] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [completedDayNumber, setCompletedDayNumber] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isUuidFormat = tokenFromRoute && isAccessToken(tokenFromRoute);

  // Try to fetch as access token first (for external participants)
  const { data: externalData, isLoading: externalLoading, error: externalError } = useQuery<{
    participant: Participant;
    journey: Journey;
  }>({
    queryKey: ["/api/participant/token", tokenFromRoute],
    queryFn: () => fetch(`/api/participant/token/${tokenFromRoute}`).then(res => {
      if (!res.ok) throw new Error("Invalid access token");
      return res.json();
    }),
    enabled: !!isUuidFormat,
    retry: false,
  });

  // Determine if this is truly external access (access token worked) or mentor preview (access token failed)
  const isExternalAccess = !!externalData && !externalError;

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/user");
      return res.json();
    },
    enabled: !isExternalAccess,
  });

  const { data: allJourneys } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
    queryFn: () => fetch("/api/journeys").then(res => res.json()),
    enabled: !tokenFromRoute,
  });

  const publishedJourneys = allJourneys?.filter(j => j.status === "published") || [];
  
  // For mentor preview: if access token lookup failed but we have a UUID, treat it as journey ID
  const journeyId = isExternalAccess 
    ? externalData?.journey?.id 
    : (tokenFromRoute || publishedJourneys[0]?.id);

  const { data: journey, isLoading: journeyLoading } = useQuery<JourneyWithSteps>({
    queryKey: ["/api/journeys", journeyId, "full"],
    queryFn: () => fetch(`/api/journeys/${journeyId}/full`).then(res => res.json()),
    enabled: !!journeyId && !isExternalAccess,
  });

  const { data: participant, isLoading: participantLoading, error: participantError } = useQuery<Participant>({
    queryKey: ["/api/participants/journey", journeyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/participants/journey/${journeyId}`);
      return res.json();
    },
    enabled: !!journeyId && !isExternalAccess && !!currentUser,
  });

  const resolvedJourney = isExternalAccess ? externalData?.journey as JourneyWithSteps | undefined : journey;
  const resolvedParticipant = isExternalAccess ? externalData?.participant : participant;
  const resolvedLoading = isExternalAccess ? externalLoading : (journeyLoading || (!!currentUser && participantLoading));

  // Helper to get mentor display name
  const mentorName = resolvedJourney?.mentor?.firstName 
    ? `${resolvedJourney.mentor.firstName}${resolvedJourney.mentor.lastName ? ' ' + resolvedJourney.mentor.lastName : ''}`
    : "Your Mentor";
  
  const mentorImage = resolvedJourney?.mentor?.profileImageUrl;
  
  // Helper to get user display name - for external participants, use their name
  const userName = isExternalAccess 
    ? (resolvedParticipant?.name || resolvedParticipant?.email?.split('@')[0] || "You")
    : (currentUser?.firstName || "You");

  const currentDay = resolvedParticipant?.currentDay ?? 1;
  const sortedSteps = [...(resolvedJourney?.steps || [])].sort((a, b) => a.dayNumber - b.dayNumber);
  const currentStep = sortedSteps.find(s => s.dayNumber === currentDay);
  const totalDays = sortedSteps.length || resolvedJourney?.duration || 7;
  const isCompleted = currentDay > totalDays;
  const progressPercent = Math.round(((currentDay - 1) / totalDays) * 100);
  const completedDays = currentDay - 1;
  const xpPoints = completedDays * 100;
  const streak = completedDays;

  const { data: messages = [], isLoading: messagesLoading } = useQuery<JourneyMessage[]>({
    queryKey: ["messages", resolvedParticipant?.id, currentStep?.id],
    queryFn: async () => {
      if (!resolvedParticipant?.id || !currentStep?.id) return [];
      const msgs = await chatApi.startDay(resolvedParticipant.id, currentStep.id);
      return msgs;
    },
    enabled: !!resolvedParticipant?.id && !!currentStep?.id && !isCompleted,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!resolvedParticipant?.id || !currentStep?.id) throw new Error("Missing participant or step");
      return chatApi.sendMessage(resolvedParticipant.id, currentStep.id, content);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JourneyMessage[]>(
        ["messages", resolvedParticipant?.id, currentStep?.id],
        (old = []) => [...old, data.userMessage, data.botMessage]
      );
      if (data.dayCompleted) {
        setDayReadyForCompletion(true);
      }
    },
  });

  const completeDayMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedParticipant || !resolvedJourney) return;
      const res = await apiRequest("POST", `/api/participants/${resolvedParticipant.id}/complete-day`, {
        dayNumber: resolvedParticipant.currentDay,
        journeyId: resolvedJourney.id,
      });
      return res.json();
    },
    onSuccess: () => {
      const justCompletedDay = resolvedParticipant?.currentDay ?? 1;
      setCompletedDayNumber(justCompletedDay);
      setShowCelebration(true);
      setDayReadyForCompletion(false);
      setTimeout(() => {
        setShowCelebration(false);
        // Show feedback modal after celebration
        setShowFeedbackModal(true);
        setFeedbackRating(0);
        setFeedbackComment("");
        if (isExternalAccess) {
          queryClient.invalidateQueries({ queryKey: ["/api/participant/token", tokenFromRoute] });
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/participants/journey", journeyId] });
        }
      }, 2000);
    },
  });

  const handleSubmitFeedback = async () => {
    if (!resolvedParticipant || !resolvedJourney || feedbackRating === 0) return;
    
    setFeedbackSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: resolvedParticipant.id,
          journeyId: resolvedJourney.id,
          rating: feedbackRating,
          comment: feedbackComment || null,
          dayNumber: completedDayNumber,
          feedbackType: completedDayNumber === totalDays ? "final" : "day",
        }),
      });
      setShowFeedbackModal(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleSkipFeedback = () => {
    setShowFeedbackModal(false);
  };

  useEffect(() => {
    setDayReadyForCompletion(false);
  }, [currentDay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Show error only if access token is invalid AND user is not logged in (can't preview)
  const showInvalidLinkError = externalError && !externalLoading && !currentUser && !journey;
  
  if (showInvalidLinkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">קישור לא תקין</h1>
          <p className="text-gray-600 mb-6">הקישור שלך לא תקין או פג תוקף.</p>
          <Link href="/">
            <Button>חזרה לדף הבית</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is mentor preview mode (logged in user viewing their own flow)
  const isMentorPreview = !!currentUser && !!journey && journey.creatorId === currentUser.id && !resolvedParticipant;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    queryClient.setQueryData<JourneyMessage[]>(
      ["messages", resolvedParticipant?.id, currentStep?.id],
      (old = []) => [...old, {
        id: "temp-" + Date.now(),
        participantId: resolvedParticipant!.id,
        stepId: currentStep!.id,
        role: "user",
        content,
        createdAt: new Date(),
        isSummary: false,
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

  if (resolvedLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your journey...</p>
        </div>
      </div>
    );
  }

  // For mentor preview, show preview mode with the journey content
  if (isMentorPreview && resolvedJourney) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 mb-6 text-center">
            <p className="text-amber-800 font-medium">Preview Mode</p>
            <p className="text-amber-700 text-sm">This is how participants will see your flow</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{resolvedJourney.name}</h1>
            <p className="text-gray-500 mb-6">{resolvedJourney.duration} Days Journey</p>
            
            <div className="space-y-4 text-right mb-8">
              {sortedSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500">{step.description?.slice(0, 60)}...</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link href={`/journeys/${resolvedJourney.id}`}>
              <Button className="w-full bg-violet-600 hover:bg-violet-700">
                Back to Editor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resolvedJourney || !resolvedParticipant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Flow not found</p>
          <Link href="/">
            <Button className="bg-violet-600 hover:bg-violet-700">Go Home</Button>
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
            Congratulations on completing "{resolvedJourney?.name}"
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
            <Button className="w-full bg-violet-600 hover:bg-violet-700">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  How was Day {completedDayNumber}?
                </h2>
                <p className="text-gray-500 text-sm">
                  Your feedback helps {mentorName} improve the experience
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`feedback-star-${star}`}
                  >
                    <Star 
                      className={cn(
                        "w-10 h-10 transition-colors",
                        star <= feedbackRating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )} 
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts (optional)"
                className="w-full p-3 border border-gray-200 rounded-xl resize-none h-24 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                data-testid="feedback-comment"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipFeedback}
                  className="flex-1"
                  data-testid="feedback-skip"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackRating === 0 || feedbackSubmitting}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  data-testid="feedback-submit"
                >
                  {feedbackSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Feedback"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-violet-600 via-violet-700 to-purple-800 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header - Mentor info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mentorImage ? (
                <img 
                  src={mentorImage} 
                  alt={mentorName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg backdrop-blur-sm">
                  {mentorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-violet-200 font-medium">Your Guide</p>
                <h1 className="font-bold text-white text-sm">{mentorName}</h1>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Journey name */}
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-white text-sm">{resolvedJourney?.name}</h2>
          <p className="text-xs text-violet-200 mt-1">Day {currentDay} of {totalDays}</p>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-violet-200">Your Progress</span>
            <span className="text-xs font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-violet-300 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Days navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-violet-300 uppercase tracking-wider mb-3 px-2">Your Journey</div>
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
                    isCurrent && "bg-white/20 backdrop-blur-sm",
                    isPast && "opacity-80 hover:opacity-100 hover:bg-white/10",
                    isFuture && "opacity-40 cursor-not-allowed"
                  )}
                  data-testid={`sidebar-day-${step.dayNumber}`}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isPast && "bg-emerald-400 text-white",
                    isCurrent && "bg-white text-violet-600",
                    isFuture && "bg-white/20 text-white/60"
                  )}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : step.dayNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn(
                      "text-sm font-medium truncate",
                      isCurrent ? "text-white" : "text-white/80"
                    )}>
                      {step.title || `Day ${step.dayNumber}`}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-violet-200">In progress</div>
                    )}
                    {isPast && (
                      <div className="text-xs text-emerald-300">Completed</div>
                    )}
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-4 h-4 text-white shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback button at bottom of sidebar */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              setCompletedDayNumber(currentDay);
              setShowFeedbackModal(true);
              setFeedbackRating(0);
              setFeedbackComment("");
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white text-sm"
            data-testid="button-open-feedback"
          >
            <MessageCircle className="w-4 h-4" />
            Share Feedback
          </button>
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
      <main className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              {mentorImage ? (
                <img 
                  src={mentorImage} 
                  alt={mentorName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-violet-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {mentorName.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-gray-900" data-testid="text-step-title">
                  {mentorName}
                </h2>
                <p className="text-xs text-gray-500" data-testid="text-day-progress">
                  Day {currentDay} of {totalDays}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full overflow-hidden">
          {/* Messages - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 pb-44 space-y-4" ref={scrollRef}>
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
                          className="w-9 h-9 rounded-full object-cover border-2 border-violet-200"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {mentorName.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] sm:max-w-[75%]",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    <div 
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                        msg.role === "user" 
                          ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-sm shadow-md" 
                          : "bg-white text-gray-700 rounded-bl-sm shadow-sm border border-gray-100"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm">
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
                      className="w-9 h-9 rounded-full object-cover border-2 border-violet-200"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area - fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-72 border-t border-gray-200 p-4 bg-white z-20">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-3 max-w-3xl mx-auto"
            >
              <div className="flex-1 relative">
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-full bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-violet-500 pr-12 py-6"
                  disabled={isSending}
                  data-testid="input-chat"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg"
                  disabled={isSending || !inputValue.trim()}
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            
            {/* Complete day button - prominent when AI indicates day is done */}
            {dayReadyForCompletion && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <div className="text-sm text-emerald-600 font-medium mb-2">
                  You've completed today's work!
                </div>
                <Button
                  onClick={handleCompleteDay}
                  disabled={completeDayMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-lg text-white animate-pulse"
                  data-testid="button-complete-day"
                >
                  {completeDayMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Continue to Day {currentDay + 1}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
