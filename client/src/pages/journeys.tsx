import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Plus, Loader2, MoreVertical, Pencil, Trash2, Eye, 
  BookOpen, Link2, Clock, Users, Rocket, CheckCircle, FileEdit,
  Sparkles, ArrowRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Journey } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteJourneyId, setDeleteJourneyId] = useState<string | null>(null);
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const isHebrew = i18n.language === 'he';
  
  const { data: journeys = [], isLoading } = useQuery<Journey[]>({
    queryKey: ["/api/journeys/my"],
    queryFn: journeyApi.getMy,
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: journeyApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      setDeleteJourneyId(null);
    },
    onError: () => {
      toast({ title: t('dashboard:error'), variant: "destructive" });
    },
  });

  const handleDelete = () => {
    if (deleteJourneyId) {
      deleteMutation.mutate(deleteJourneyId);
    }
  };

  const handleCopyLink = (journey: Journey) => {
    const url = journey.shortCode 
      ? `${window.location.origin}/f/${journey.shortCode}`
      : `${window.location.origin}/j/${journey.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('dashboard:journeysPage.linkCopied') });
  };

  return (
    <DashboardLayout variant="dark">
      <div className="relative min-h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-600/40"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('dashboard:journeysPage.title')}
              </motion.h1>
              <motion.p 
                className="text-white/50 text-sm mt-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {t('dashboard:journeysPage.subtitle')}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-32"
            >
              <div className="text-center">
                <motion.div 
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-violet-600/40"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 25px 50px -12px rgba(139, 92, 246, 0.4)",
                      "0 25px 50px -12px rgba(139, 92, 246, 0.6)",
                      "0 25px 50px -12px rgba(139, 92, 246, 0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                </motion.div>
                <p className="text-white/50 text-lg">{t('dashboard:loadingFlow')}</p>
              </div>
            </motion.div>
          ) : journeys.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center py-20"
            >
              <div className="relative max-w-lg w-full">
                <motion.div 
                  className="absolute -top-20 -start-20 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px]"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute -bottom-10 -end-10 w-60 h-60 bg-fuchsia-600/15 rounded-full blur-[80px]"
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.15, 0.25, 0.15]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-fuchsia-600/5" />
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-violet-600/30"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    >
                      <Sparkles className="w-12 h-12 text-white" />
                    </motion.div>
                    
                    <motion.h3 
                      className="text-2xl font-bold text-white mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {t('dashboard:journeysPage.noFlowsYet')}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-white/50 mb-8 text-lg leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {t('dashboard:journeysPage.createFirstFlowDescription')}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Link href="/journeys/new">
                        <Button 
                          className="h-14 px-10 text-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-90 shadow-2xl shadow-violet-600/30 rounded-2xl group"
                          data-testid="button-create-first-journey"
                        >
                          <Plus className="w-5 h-5 mx-2" />
                          {t('dashboard:journeysPage.createFirstFlow')}
                          <ArrowRight className="w-5 h-5 mx-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {journeys.map((journey, index) => (
                <motion.div
                  key={journey.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.08,
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                >
                  <div 
                    className="group relative bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-5 transition-all duration-500 hover:bg-white/[0.06] hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-600/10 overflow-hidden"
                    data-testid={`card-journey-${journey.id}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 via-transparent to-fuchsia-600/0 group-hover:from-violet-600/5 group-hover:to-fuchsia-600/5 transition-all duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <motion.div 
                            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 ${
                              journey.status === "published" 
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25" 
                                : "bg-gradient-to-br from-violet-600 to-purple-600 shadow-violet-600/25"
                            }`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            {journey.status === "published" ? (
                              <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                              <FileEdit className="w-5 h-5 text-white" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-lg truncate group-hover:text-violet-200 transition-colors" data-testid={`text-journey-name-${journey.id}`}>
                              {journey.name}
                            </h3>
                            <span 
                              className={`inline-flex items-center gap-1.5 text-xs mt-1 ${
                                journey.status === "published" 
                                  ? "text-emerald-400" 
                                  : "text-white/40"
                              }`} 
                              data-testid={`badge-status-${journey.id}`}
                            >
                              {journey.status === "published" ? t('dashboard:published') : t('dashboard:draft')}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/30 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all" 
                              data-testid={`button-menu-${journey.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1030] backdrop-blur-xl border-white/10 text-white">
                            <Link href={`/journey/${journey.id}/edit`}>
                              <DropdownMenuItem className="text-white/80 focus:bg-white/10 focus:text-white" data-testid={`menu-edit-${journey.id}`}>
                                <Pencil className="mx-2 h-4 w-4" />
                                {t('dashboard:journeysPage.edit')}
                              </DropdownMenuItem>
                            </Link>
                            {journey.status === "published" && (
                              <Link href={`/j/${journey.id}`} target="_blank">
                                <DropdownMenuItem className="text-white/80 focus:bg-white/10 focus:text-white" data-testid={`menu-preview-${journey.id}`}>
                                  <Eye className="mx-2 h-4 w-4" />
                                  {t('dashboard:journeysPage.preview')}
                                </DropdownMenuItem>
                              </Link>
                            )}
                            <DropdownMenuItem 
                              className="text-white/80 focus:bg-white/10 focus:text-white"
                              onClick={() => handleCopyLink(journey)}
                              data-testid={`menu-copy-link-${journey.id}`}
                            >
                              <Link2 className="mx-2 h-4 w-4" />
                              {t('dashboard:journeysPage.copyLink')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                              onClick={() => setDeleteJourneyId(journey.id)}
                              data-testid={`menu-delete-${journey.id}`}
                            >
                              <Trash2 className="mx-2 h-4 w-4" />
                              {t('dashboard:journeysPage.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {journey.description && (
                        <p className="text-sm text-white/30 line-clamp-2 mb-4 group-hover:text-white/40 transition-colors">
                          {journey.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-white/25 mb-5">
                        {journey.duration && (
                          <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            {t('dashboard:journeysPage.daysCount', { count: journey.duration })}
                          </span>
                        )}
                        {journey.audience && (
                          <span className="flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5" />
                            <span className="truncate">{journey.audience}</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/journey/${journey.id}/edit`} className="flex-1">
                          <Button 
                            variant="ghost"
                            className="w-full border border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-violet-500/30 rounded-xl h-11"
                          >
                            <Pencil className="w-4 h-4 mx-1" />
                            {t('dashboard:journeysPage.editFlow')}
                          </Button>
                        </Link>
                        {journey.status !== "published" && (
                          <Link href={`/journey/${journey.id}/publish`}>
                            <Button className="h-11 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 shadow-lg shadow-violet-600/20 rounded-xl">
                              <Rocket className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent className="bg-[#1a1030] backdrop-blur-xl border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('dashboard:journeysPage.deleteFlowTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t('dashboard:journeysPage.deleteFlowDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white rounded-xl" data-testid="button-cancel-delete">
              {t('dashboard:journeysPage.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('dashboard:journeysPage.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
