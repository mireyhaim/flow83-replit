import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Layers, 
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type TabType = "dashboard" | "users" | "mentors" | "flows" | "errors";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMentors: number;
  activeFlows: number;
  journeysStarted30d: number;
  journeysCompleted30d: number;
}

interface Participant {
  id: string;
  email: string | null;
  name: string | null;
  currentDay: number;
  startedAt: string | null;
  lastActiveAt: string | null;
  completedAt: string | null;
  journey: { id: string; name: string; duration: number } | null;
}

interface Mentor {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string | null;
  role: string | null;
}

interface Flow {
  id: string;
  name: string;
  status: string | null;
  duration: number | null;
  mentor: { firstName: string | null; lastName: string | null; email: string | null } | null;
  participantCount: number;
  completedCount: number;
}

interface SystemError {
  id: string;
  errorType: string;
  errorMessage: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  userId: string | null;
  resolved: boolean | null;
  createdAt: string | null;
}

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: adminCheck, isLoading: checkLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: adminCheck?.isAdmin === true,
  });

  const { data: participants, refetch: refetchParticipants } = useQuery<Participant[]>({
    queryKey: ["/api/admin/participants"],
    enabled: adminCheck?.isAdmin === true && activeTab === "users",
  });

  const { data: allUsers, refetch: refetchMentors } = useQuery<Mentor[]>({
    queryKey: ["/api/admin/users"],
    enabled: adminCheck?.isAdmin === true && activeTab === "mentors",
  });

  const { data: flows, refetch: refetchFlows } = useQuery<Flow[]>({
    queryKey: ["/api/admin/flows"],
    enabled: adminCheck?.isAdmin === true && activeTab === "flows",
  });

  const { data: errors, refetch: refetchErrors } = useQuery<SystemError[]>({
    queryKey: ["/api/admin/errors"],
    enabled: adminCheck?.isAdmin === true && activeTab === "errors",
  });

  if (authLoading || checkLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/login?returnTo=/admin");
    return null;
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "mentors", label: "Mentors", icon: <UserCog className="w-4 h-4" /> },
    { id: "flows", label: "Flows", icon: <Layers className="w-4 h-4" /> },
    { id: "errors", label: "Errors", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const handleRefresh = () => {
    if (activeTab === "dashboard") refetchStats();
    if (activeTab === "users") refetchParticipants();
    if (activeTab === "mentors") refetchMentors();
    if (activeTab === "flows") refetchFlows();
    if (activeTab === "errors") refetchErrors();
  };

  const getParticipantStatus = (p: Participant) => {
    if (p.completedAt) return "Completed";
    if (!p.lastActiveAt) return "New";
    const lastActive = new Date(p.lastActiveAt);
    const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceActive > 3) return "Stuck";
    return "Active";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredParticipants = participants?.filter(p => 
    !searchTerm || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.journey?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredMentors = allUsers?.filter(u => 
    !searchTerm || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFlows = flows?.filter(f => 
    !searchTerm || 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.mentor?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-800 min-h-screen p-4 flex flex-col">
          <div className="mb-8">
            <h1 className="text-white font-bold text-lg">Flow83 Admin</h1>
            <p className="text-slate-400 text-xs">Internal Dashboard</p>
          </div>
          
          <nav className="space-y-1 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors",
                  activeTab === tab.id 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700/50"
                )}
                data-testid={`tab-${tab.id}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-slate-400 hover:text-white mt-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to App
          </Button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-3">
              {activeTab !== "dashboard" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64 bg-white"
                    data-testid="input-search"
                  />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard 
                label="Total Users" 
                value={stats?.totalUsers ?? 0} 
                loading={statsLoading}
              />
              <StatCard 
                label="Active Users (7d)" 
                value={stats?.activeUsers ?? 0} 
                loading={statsLoading}
              />
              <StatCard 
                label="Total Mentors" 
                value={stats?.totalMentors ?? 0} 
                loading={statsLoading}
              />
              <StatCard 
                label="Active Flows" 
                value={stats?.activeFlows ?? 0} 
                loading={statsLoading}
              />
              <StatCard 
                label="Journeys Started (30d)" 
                value={stats?.journeysStarted30d ?? 0} 
                loading={statsLoading}
              />
              <StatCard 
                label="Journeys Completed (30d)" 
                value={stats?.journeysCompleted30d ?? 0} 
                loading={statsLoading}
              />
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Flow</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Day</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Last Active</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredParticipants.map(p => {
                    const status = getParticipantStatus(p);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{p.email || p.name || "-"}</td>
                        <td className="px-4 py-3">{p.journey?.name || "-"}</td>
                        <td className="px-4 py-3">{p.currentDay} / {p.journey?.duration || "?"}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            status === "Completed" && "bg-green-100 text-green-700",
                            status === "Active" && "bg-blue-100 text-blue-700",
                            status === "Stuck" && "bg-red-100 text-red-700",
                            status === "New" && "bg-gray-100 text-gray-700"
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(p.lastActiveAt)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(p.startedAt)}</td>
                      </tr>
                    );
                  })}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No participants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Mentors Tab */}
          {activeTab === "mentors" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMentors.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {u.firstName || u.lastName 
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim() 
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{u.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          u.role === "super_admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                        )}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                  {filteredMentors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Flows Tab */}
          {activeTab === "flows" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Flow Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Drop Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredFlows.map(f => {
                    const dropRate = f.participantCount > 0 
                      ? Math.round((1 - f.completedCount / f.participantCount) * 100) 
                      : 0;
                    return (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{f.name}</td>
                        <td className="px-4 py-3">
                          {f.mentor?.firstName || f.mentor?.lastName 
                            ? `${f.mentor.firstName || ""} ${f.mentor.lastName || ""}`.trim()
                            : f.mentor?.email || "-"}
                        </td>
                        <td className="px-4 py-3">{f.duration || 7}</td>
                        <td className="px-4 py-3">{f.participantCount}</td>
                        <td className="px-4 py-3">{f.completedCount}</td>
                        <td className="px-4 py-3">
                          {f.participantCount > 0 ? (
                            <span className={cn(
                              dropRate > 70 ? "text-red-600" : dropRate > 40 ? "text-yellow-600" : "text-green-600"
                            )}>
                              {dropRate}%
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            f.status === "published" && "bg-green-100 text-green-700",
                            f.status === "draft" && "bg-gray-100 text-gray-700",
                            f.status === "error" && "bg-red-100 text-red-700"
                          )}>
                            {f.status || "draft"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFlows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No flows found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === "errors" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {errors && errors.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Message</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Resolved</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {errors.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            {e.errorType}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-md truncate" title={e.errorMessage}>
                          {e.errorMessage.slice(0, 100)}{e.errorMessage.length > 100 ? "..." : ""}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {e.relatedEntityType ? `${e.relatedEntityType}: ${e.relatedEntityId?.slice(0, 8)}` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {e.resolved ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No errors recorded</p>
                  <p className="text-sm mt-1">Errors will appear here when they occur</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
