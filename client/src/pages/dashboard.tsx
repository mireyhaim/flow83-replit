import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { journeyApi, statsApi, type DashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, CheckCircle, BookOpen, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Journey } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: journeys = [], isLoading: journeysLoading } = useQuery<Journey[]>({
    queryKey: ["/api/journeys/my"],
    queryFn: journeyApi.getMy,
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
    queryFn: statsApi.getDashboard,
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-md text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Flow 83</h1>
          <p className="text-muted-foreground mb-8">
            Transform your knowledge into powerful 7-day journeys that help others grow.
          </p>
          <Button size="lg" asChild data-testid="button-login">
            <a href="/api/login">Sign In to Get Started</a>
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = journeysLoading || statsLoading;

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-welcome-message">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. Your OS is active.
        </p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card data-testid="card-total-journeys">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Journeys</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-journeys">{stats?.totalJourneys ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.publishedJourneys ?? 0} published, {stats?.draftJourneys ?? 0} drafts
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-total-participants">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-participants">{stats?.totalParticipants ?? 0}</div>
                <p className="text-xs text-muted-foreground">Across all journeys</p>
              </CardContent>
            </Card>
            <Card data-testid="card-active-participants">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-participants">{stats?.activeParticipants ?? 0}</div>
                <p className="text-xs text-muted-foreground">Currently in flow</p>
              </CardContent>
            </Card>
            <Card data-testid="card-completion-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-completion-rate">{stats?.completionRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground">{stats?.completedParticipants ?? 0} completed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 md:grid-cols-2 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>My Journeys</CardTitle>
              </CardHeader>
              <CardContent>
                {journeys.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">You haven't created any journeys yet.</p>
                    <Link href="/journeys/new">
                      <Button data-testid="button-create-first-journey">
                        Create Your First Journey <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {journeys.slice(0, 5).map((journey) => (
                      <div 
                        key={journey.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`card-journey-${journey.id}`}
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{journey.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {journey.status === "published" ? "Published" : "Draft"}
                          </p>
                        </div>
                        <Link href={`/journeys/${journey.id}/edit`}>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-journey-${journey.id}`}>
                            Edit
                          </Button>
                        </Link>
                      </div>
                    ))}
                    {journeys.length > 5 && (
                      <Link href="/journeys">
                        <Button variant="outline" className="w-full" data-testid="button-view-all-journeys">
                          View All ({journeys.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1 bg-primary text-primary-foreground border-none">
              <CardHeader>
                <CardTitle>Create New Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Transform your knowledge into a 7-day transformational experience for your participants.
                </p>
                <Link href="/journeys/new">
                  <Button variant="secondary" className="w-full" data-testid="button-create-journey">
                    Create Journey <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
