import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Loader2, MoreVertical, Pencil, Trash2, Eye, BookOpen } from "lucide-react";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Journey } from "@shared/schema";

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteJourneyId, setDeleteJourneyId] = useState<string | null>(null);
  const { t } = useTranslation('dashboard');
  
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
      toast({ title: t('error'), variant: "destructive" });
    },
  });

  const handleDelete = () => {
    if (deleteJourneyId) {
      deleteMutation.mutate(deleteJourneyId);
    }
  };


  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-journeys-title">{t('journeysPage.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('journeysPage.subtitle')}</p>
        </div>
        <Link href="/journeys/new">
          <Button data-testid="button-create-journey" className="bg-violet-600 hover:bg-violet-700">
            <Plus className="me-2 h-4 w-4" />
            {t('journeysPage.newFlow')}
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-violet-600" />
          </div>
          <p className="text-slate-600 mb-6">{t('journeysPage.noFlowsYet')}</p>
          <Link href="/journeys/new">
            <Button data-testid="button-create-first-journey" className="bg-violet-600 hover:bg-violet-700">
              <Plus className="me-2 h-4 w-4" />
              {t('journeysPage.createFirstFlow')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <div 
              key={journey.id} 
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-violet-200 transition-all group"
              data-testid={`card-journey-${journey.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate" data-testid={`text-journey-name-${journey.id}`}>
                    {journey.name}
                  </h3>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                    journey.status === "published" 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "bg-slate-100 text-slate-500"
                  }`} data-testid={`badge-status-${journey.id}`}>
                    {journey.status === "published" ? t('published') : t('draft')}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100" data-testid={`button-menu-${journey.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-slate-200">
                    <Link href={`/journey/${journey.id}/edit`}>
                      <DropdownMenuItem className="text-slate-700 focus:bg-slate-100 focus:text-slate-900" data-testid={`menu-edit-${journey.id}`}>
                        <Pencil className="me-2 h-4 w-4" />
                        {t('journeysPage.edit')}
                      </DropdownMenuItem>
                    </Link>
                    {journey.status === "published" && (
                      <Link href={`/p/${journey.id}`}>
                        <DropdownMenuItem className="text-slate-700 focus:bg-slate-100 focus:text-slate-900" data-testid={`menu-preview-${journey.id}`}>
                          <Eye className="me-2 h-4 w-4" />
                          {t('journeysPage.preview')}
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem 
                      className="text-red-600 focus:bg-red-50 focus:text-red-600"
                      onClick={() => setDeleteJourneyId(journey.id)}
                      data-testid={`menu-delete-${journey.id}`}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('journeysPage.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {journey.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {journey.description}
                </p>
              )}
              {journey.duration && (
                <p className="text-xs text-slate-400">
                  {t('journeysPage.daysCount', { count: journey.duration })}
                </p>
              )}
              <Link href={`/journey/${journey.id}/edit`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-violet-200"
                >
                  <Pencil className="me-2 h-3 w-3" />
                  {t('journeysPage.editFlow')}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">{t('journeysPage.deleteFlowTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {t('journeysPage.deleteFlowDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" data-testid="button-cancel-delete">{t('journeysPage.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('journeysPage.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
