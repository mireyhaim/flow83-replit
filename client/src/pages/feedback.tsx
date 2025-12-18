import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { feedbackApi, type FeedbackItem } from "@/lib/api";
import { MessageCircle, Star, Loader2, User, Calendar, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function FeedbackPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: feedbackList = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/feedback"],
    queryFn: feedbackApi.getAll,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  const averageRating = feedbackList.length > 0 
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
    : "0";

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white" data-testid="text-feedback-title">
          Feedback
        </h1>
        <p className="text-white/50 text-sm mt-1">
          See what your participants are saying about your flows
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-fuchsia-400" />
            </div>
            <span className="text-sm text-white/60">Total Feedback</span>
          </div>
          <div className="text-3xl font-bold text-white" data-testid="text-total-feedback">
            {feedbackList.length}
          </div>
        </div>

        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-sm text-white/60">Average Rating</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white" data-testid="text-avg-rating">{averageRating}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(Number(averageRating)) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-emerald-400 fill-emerald-400" />
            </div>
            <span className="text-sm text-white/60">5-Star Reviews</span>
          </div>
          <div className="text-3xl font-bold text-white" data-testid="text-5star-count">
            {feedbackList.filter(f => f.rating === 5).length}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">All Feedback</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-white/30" />
            </div>
            <p className="text-white/40 mb-2">No feedback yet</p>
            <p className="text-white/30 text-sm">When participants leave feedback, it will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <div 
                key={feedback.id} 
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                data-testid={`feedback-item-${feedback.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{feedback.participantName}</p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <BookOpen className="h-3 w-3" />
                        <span>{feedback.journeyName}</span>
                        {feedback.dayNumber && (
                          <>
                            <span>•</span>
                            <span>Day {feedback.dayNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
                
                {feedback.comment && (
                  <p className="text-white/70 text-sm mb-3 leading-relaxed">{feedback.comment}</p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
