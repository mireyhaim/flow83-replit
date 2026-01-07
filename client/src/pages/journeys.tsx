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
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t('dashboard:journeysPage.title')}
            </h1>
            <p className="text-slate-500 text-sm">
              {t('dashboard:journeysPage.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-violet-600/20">
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            </div>
            <p className="text-slate-500">{t('dashboard:loadingFlow')}</p>
          </div>
        </div>
      ) : journeys.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-violet-600/20">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              {t('dashboard:journeysPage.noFlowsYet')}
            </h3>
            <p className="text-slate-500 mb-6">
              {t('dashboard:journeysPage.createFirstFlowDescription')}
            </p>
            <Link href="/journeys/new">
              <Button 
                className="h-12 px-8 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20"
                data-testid="button-create-first-journey"
              >
                <Plus className="w-5 h-5 mx-2" />
                {t('dashboard:journeysPage.createFirstFlow')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <div 
              key={journey.id}
              className="group bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-violet-200"
              data-testid={`card-journey-${journey.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      journey.status === "published" 
                        ? "bg-emerald-100 text-emerald-600" 
                        : "bg-violet-100 text-violet-600"
                    }`}
                  >
                    {journey.status === "published" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <FileEdit className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate" data-testid={`text-journey-name-${journey.id}`}>
                      {journey.name}
                    </h3>
                    <span 
                      className={`inline-flex items-center gap-1 text-xs mt-1 ${
                        journey.status === "published" 
                          ? "text-emerald-600" 
                          : "text-slate-400"
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
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {journey.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
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
                    variant="outline"
                    className="w-full"
                  >
                    <Pencil className="w-4 h-4 mx-1" />
                    {t('dashboard:journeysPage.editFlow')}
                  </Button>
                </Link>
                {journey.status !== "published" && (
                  <Link href={`/journey/${journey.id}/publish`}>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <Rocket className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
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
    </DashboardLayout>
  );
}
