import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Plus, Loader2, MoreVertical, Pencil, Trash2, Eye, 
  Link2, Clock, Users, Rocket, Archive, RotateCcw
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Journey } from "@shared/schema";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteJourneyId, setDeleteJourneyId] = useState<string | null>(null);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  const [archiveJourneyId, setArchiveJourneyId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const { t } = useTranslation(['dashboard', 'common']);
  
  const { data: journeys = [], isLoading } = useQuery<Journey[]>({
    queryKey: ["/api/journeys/my"],
    queryFn: journeyApi.getMy,
    enabled: isAuthenticated,
  });

  const { data: archivedJourneys = [], isLoading: isLoadingArchived } = useQuery<Journey[]>({
    queryKey: ["/api/journeys/archived"],
    queryFn: journeyApi.getArchived,
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

  const archiveMutation = useMutation({
    mutationFn: journeyApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journeys/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      setArchiveJourneyId(null);
      setShowArchivePrompt(false);
      toast({ title: t('dashboard:journeysPage.flowArchived') });
    },
    onError: () => {
      toast({ title: t('dashboard:error'), variant: "destructive" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: journeyApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journeys/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({ title: t('dashboard:journeysPage.flowRestored') });
    },
    onError: () => {
      toast({ title: t('dashboard:error'), variant: "destructive" });
    },
  });

  const handleDeleteClick = async (journeyId: string) => {
    try {
      const { count } = await journeyApi.getParticipantCount(journeyId);
      if (count > 0) {
        setParticipantCount(count);
        setArchiveJourneyId(journeyId);
        setShowArchivePrompt(true);
      } else {
        setDeleteJourneyId(journeyId);
      }
    } catch {
      setDeleteJourneyId(journeyId);
    }
  };

  const handleDelete = () => {
    if (deleteJourneyId) {
      deleteMutation.mutate(deleteJourneyId);
    }
  };

  const handleArchive = () => {
    if (archiveJourneyId) {
      archiveMutation.mutate(archiveJourneyId);
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
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
          {t('dashboard:journeysPage.title')}
        </h1>
        <p className="text-slate-500 text-sm">
          {t('dashboard:journeysPage.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : journeys.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {t('dashboard:journeysPage.noFlowsYet')}
            </h3>
            <p className="text-slate-500 mb-6">
              {t('dashboard:journeysPage.createFirstFlowDescription')}
            </p>
            <Link href="/journeys/new">
              <Button 
                className="h-12 px-8 bg-violet-600 hover:bg-violet-700"
                data-testid="button-create-first-journey"
              >
                <Plus className="w-5 h-5 mx-2" />
                {t('dashboard:journeysPage.createFirstFlow')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <div 
              key={journey.id}
              className="group bg-white rounded-xl border border-slate-200 p-4 md:p-5 transition-all duration-200 hover:shadow-md hover:border-violet-200"
              data-testid={`card-journey-${journey.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate" data-testid={`text-journey-name-${journey.id}`}>
                    {journey.name}
                  </h3>
                  <span 
                    className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${
                      journey.status === "published" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-slate-100 text-slate-500"
                    }`} 
                    data-testid={`badge-status-${journey.id}`}
                  >
                    {journey.status === "published" ? t('dashboard:published') : t('dashboard:draft')}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
                      data-testid={`button-menu-${journey.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/journey/${journey.id}/edit`}>
                      <DropdownMenuItem data-testid={`menu-edit-${journey.id}`}>
                        <Pencil className="mx-2 h-4 w-4" />
                        {t('dashboard:journeysPage.edit')}
                      </DropdownMenuItem>
                    </Link>
                    {journey.status === "published" && (
                      <Link href={`/j/${journey.id}`} target="_blank">
                        <DropdownMenuItem data-testid={`menu-preview-${journey.id}`}>
                          <Eye className="mx-2 h-4 w-4" />
                          {t('dashboard:journeysPage.preview')}
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleCopyLink(journey)}
                      data-testid={`menu-copy-link-${journey.id}`}
                    >
                      <Link2 className="mx-2 h-4 w-4" />
                      {t('dashboard:journeysPage.copyLink')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDeleteClick(journey.id)}
                      data-testid={`menu-delete-${journey.id}`}
                    >
                      <Trash2 className="mx-2 h-4 w-4" />
                      {t('dashboard:journeysPage.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {journey.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {journey.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                {journey.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('dashboard:journeysPage.daysCount', { count: journey.duration })}
                  </span>
                )}
                {journey.audience && (
                  <span className="flex items-center gap-1 truncate">
                    <Users className="w-3.5 h-3.5" />
                    <span className="truncate">{journey.audience}</span>
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Link href={`/journey/${journey.id}/edit`} className="flex-1">
                  <Button 
                    variant="outline"
                    className="w-full h-11 md:h-9 text-sm"
                  >
                    {t('dashboard:journeysPage.editFlow')}
                  </Button>
                </Link>
                {journey.status !== "published" && (
                  <Link href={`/journey/${journey.id}/publish`}>
                    <Button className="bg-violet-600 hover:bg-violet-700 h-11 md:h-9 px-4">
                      <Rocket className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {archivedJourneys.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            {t('dashboard:journeysPage.archivedFlows')}
          </h2>
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {archivedJourneys.map((journey) => (
              <div 
                key={journey.id}
                className="group bg-slate-50 rounded-xl border border-slate-200 p-4 md:p-5 opacity-75"
                data-testid={`card-archived-journey-${journey.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-700 truncate">
                      {journey.name}
                    </h3>
                    <span className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                      {t('dashboard:journeysPage.archived')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMutation.mutate(journey.id)}
                    disabled={restoreMutation.isPending}
                    className="text-violet-600 border-violet-200 hover:bg-violet-50"
                    data-testid={`button-restore-${journey.id}`}
                  >
                    {restoreMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mx-1" />
                        {t('dashboard:journeysPage.restore')}
                      </>
                    )}
                  </Button>
                </div>
                {journey.description && (
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {journey.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard:journeysPage.deleteFlowTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard:journeysPage.deleteFlowDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
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

      <AlertDialog open={showArchivePrompt} onOpenChange={(open) => { if (!open) { setShowArchivePrompt(false); setArchiveJourneyId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard:journeysPage.cannotDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard:journeysPage.cannotDeleteDescription', { count: participantCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-archive">
              {t('dashboard:journeysPage.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              className="bg-violet-600 text-white hover:bg-violet-700"
              data-testid="button-confirm-archive"
            >
              {archiveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Archive className="w-4 h-4 mx-1" />
                  {t('dashboard:journeysPage.archiveInstead')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
