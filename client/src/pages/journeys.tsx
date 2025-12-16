import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Loader2, MoreVertical, Pencil, Trash2, Eye, BookOpen } from "lucide-react";
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
      toast({ title: "Failed to delete flow", variant: "destructive" });
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
          <h1 className="text-2xl font-semibold text-white" data-testid="text-journeys-title">My Flows</h1>
          <p className="text-white/50 text-sm mt-1">Manage your transformational flows</p>
        </div>
        <Link href="/journeys/new">
          <Button data-testid="button-create-journey" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : journeys.length === 0 ? (
        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-violet-400" />
          </div>
          <p className="text-white/60 mb-6">You haven't created any flows yet.</p>
          <Link href="/journeys/new">
            <Button data-testid="button-create-first-journey" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Flow
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <div 
              key={journey.id} 
              className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
              data-testid={`card-journey-${journey.id}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate" data-testid={`text-journey-name-${journey.id}`}>
                    {journey.name}
                  </h3>
                  <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
                    journey.status === "published" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-white/10 text-white/50"
                  }`} data-testid={`badge-status-${journey.id}`}>
                    {journey.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10" data-testid={`button-menu-${journey.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
                    <Link href={`/journey/${journey.id}/edit`}>
                      <DropdownMenuItem className="text-white focus:bg-white/10 focus:text-white" data-testid={`menu-edit-${journey.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    {journey.status === "published" && (
                      <Link href={`/p/${journey.id}`}>
                        <DropdownMenuItem className="text-white focus:bg-white/10 focus:text-white" data-testid={`menu-preview-${journey.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem 
                      className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      onClick={() => setDeleteJourneyId(journey.id)}
                      data-testid={`menu-delete-${journey.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {journey.description && (
                <p className="text-sm text-white/40 line-clamp-2 mb-3">
                  {journey.description}
                </p>
              )}
              {journey.duration && (
                <p className="text-xs text-white/30">
                  {journey.duration} days
                </p>
              )}
              <Link href={`/journey/${journey.id}/edit`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-violet-500/30"
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit Flow
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Flow?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently delete this flow and all its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
