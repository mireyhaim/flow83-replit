import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Plus, Loader2, MoreVertical, Pencil, Trash2, Eye, 
  BookOpen, Link2, Clock, Users, Rocket, CheckCircle, FileEdit
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
import { motion } from "framer-motion";
import { GlassPanel, GradientHeader } from "@/components/ui/glass-panel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteJourneyId, setDeleteJourneyId] = useState<string | null>(null);
  const { t } = useTranslation(['dashboard', 'common']);
  
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <GradientHeader
          icon={<BookOpen className="w-full h-full" />}
          title={t('dashboard:journeysPage.title')}
          subtitle={t('dashboard:journeysPage.subtitle')}
          size="lg"
        />
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-4 shadow-2xl shadow-violet-600/30">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <p className="text-white/50">{t('dashboard:loadingFlow')}</p>
          </div>
        </div>
      ) : journeys.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassPanel variant="highlight" padding="lg" className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6 shadow-xl shadow-violet-600/25">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{t('dashboard:journeysPage.noFlowsYet')}</h3>
            <p className="text-white/50 mb-6">{t('dashboard:journeysPage.subtitle')}</p>
            <Link href="/journeys/new">
              <Button 
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 h-12 px-8 shadow-lg shadow-violet-600/25"
                data-testid="button-create-first-journey"
              >
                <Plus className="w-5 h-5 mx-2" />
                {t('dashboard:journeysPage.createFirstFlow')}
              </Button>
            </Link>
          </GlassPanel>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey, index) => (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassPanel 
                className="group hover:border-violet-500/30 transition-all duration-300"
                data-testid={`card-journey-${journey.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg truncate mb-2" data-testid={`text-journey-name-${journey.id}`}>
                      {journey.name}
                    </h3>
                    <span 
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                        journey.status === "published" 
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                          : "bg-white/10 text-white/50 border border-white/10"
                      }`} 
                      data-testid={`badge-status-${journey.id}`}
                    >
                      {journey.status === "published" ? (
                        <><CheckCircle className="w-3 h-3" /> {t('dashboard:published')}</>
                      ) : (
                        <><FileEdit className="w-3 h-3" /> {t('dashboard:draft')}</>
                      )}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/40 hover:text-white hover:bg-white/10" 
                        data-testid={`button-menu-${journey.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white">
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
                  <p className="text-sm text-white/40 line-clamp-2 mb-4">
                    {journey.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-white/30 mb-4">
                  {journey.duration && (
                    <span className="flex items-center gap-1.5">
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
                      className="w-full border border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-violet-500/30"
                    >
                      <Pencil className="w-4 h-4 mx-1" />
                      {t('dashboard:journeysPage.editFlow')}
                    </Button>
                  </Link>
                  {journey.status !== "published" && (
                    <Link href={`/journey/${journey.id}/publish`}>
                      <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 shadow-lg shadow-violet-600/20">
                        <Rocket className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('dashboard:journeysPage.deleteFlowTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {t('dashboard:journeysPage.deleteFlowDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20 hover:text-white" data-testid="button-cancel-delete">
              {t('dashboard:journeysPage.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
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
