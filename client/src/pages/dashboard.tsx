import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { stats, method } = useStore();

  return (
    <DashboardLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Your OS is active.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeParticipants}</div>
            <p className="text-xs text-muted-foreground">Currently in flow</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">+4% from average</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{method?.name || "No Method Defined"}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {method?.purpose}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/method">
                  <Button variant="outline" size="sm">Edit Method</Button>
                </Link>
                <Link href="/journeys/new">
                  <Button size="sm">Generate New Journey <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle>Quick Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/80 text-sm mb-4">
              See what your participants see. Test the mobile experience directly in your browser.
            </p>
            <Link href="/p/demo-preview">
              <Button variant="secondary" className="w-full">
                Launch Participant View
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
