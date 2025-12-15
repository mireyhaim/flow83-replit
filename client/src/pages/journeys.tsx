import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { journeyApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Loader2, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
      toast({ title: "Journey deleted" });
      setDeleteJourneyId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete journey", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-journeys-title">My Journeys</h1>
          <p className="text-muted-foreground">Manage your transformational journeys.</p>
        </div>
        <Link href="/journeys/new">
          <Button data-testid="button-create-journey">
            <Plus className="mr-2 h-4 w-4" />
            New Journey
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : journeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">You haven't created any journeys yet.</p>
            <Link href="/journeys/new">
              <Button data-testid="button-create-first-journey">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Journey
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map((journey) => (
            <Card key={journey.id} data-testid={`card-journey-${journey.id}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold truncate" data-testid={`text-journey-name-${journey.id}`}>
                    {journey.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={journey.status === "published" ? "default" : "secondary"}
                      data-testid={`badge-status-${journey.id}`}
                    >
                      {journey.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-menu-${journey.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/journey/${journey.id}/edit`}>
                      <DropdownMenuItem data-testid={`menu-edit-${journey.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </Link>
                    {journey.status === "published" && (
                      <Link href={`/p/${journey.id}`}>
                        <DropdownMenuItem data-testid={`menu-preview-${journey.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteJourneyId(journey.id)}
                      data-testid={`menu-delete-${journey.id}`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {journey.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {journey.description}
                  </p>
                )}
                {journey.duration && (
                  <p className="text-xs text-muted-foreground">
                    {journey.duration} days
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteJourneyId} onOpenChange={(open) => !open && setDeleteJourneyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this journey and all its content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
