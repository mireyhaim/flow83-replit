import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ChevronRight,
  Lock,
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Admin token storage
const ADMIN_TOKEN_KEY = "flow83_admin_token";

function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Custom fetch function that adds admin token header
async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "x-admin-token": token || "",
    },
  });
}

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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  // Admin auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAdminToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const res = await adminFetch("/api/admin/verify");
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          clearAdminToken();
          setIsAuthenticated(false);
        }
      } catch {
        clearAdminToken();
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success && data.token) {
        setAdminToken(data.token);
        setIsAuthenticated(true);
        queryClient.invalidateQueries();
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (error) {
      setLoginError("Connection error. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await adminFetch("/api/admin/logout", { method: "POST" });
    clearAdminToken();
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: participants, refetch: refetchParticipants } = useQuery<Participant[]>({
    queryKey: ["/api/admin/participants"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/participants");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true && activeTab === "users",
  });

  const { data: allUsers, refetch: refetchMentors } = useQuery<Mentor[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true && activeTab === "mentors",
  });

  const { data: flows, refetch: refetchFlows } = useQuery<Flow[]>({
    queryKey: ["/api/admin/flows"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/flows");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true && activeTab === "flows",
  });

  const { data: errors, refetch: refetchErrors } = useQuery<SystemError[]>({
    queryKey: ["/api/admin/errors"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/errors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true && activeTab === "errors",
  });

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Login</h1>
              <p className="text-slate-400 text-sm mt-1">Flow83 Administration</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter username"
                  data-testid="input-admin-username"
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter password"
                  data-testid="input-admin-password"
                  autoComplete="current-password"
                />
              </div>
              
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{loginError}</p>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={isLoggingIn || !loginForm.username || !loginForm.password}
                data-testid="button-admin-login"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </div>
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
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-950 min-h-screen p-4 flex flex-col border-r border-slate-800">
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

          <div className="space-y-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="w-full text-slate-400 hover:text-white justify-start"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-start"
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-3">
              {activeTab !== "dashboard" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    data-testid="input-search"
                  />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
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
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-850 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Flow</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Day</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Last Active</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredParticipants.map(p => {
                    const status = getParticipantStatus(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-200">{p.email || p.name || "-"}</td>
                        <td className="px-4 py-3 text-slate-200">{p.journey?.name || "-"}</td>
                        <td className="px-4 py-3 text-slate-200">{p.currentDay} / {p.journey?.duration || "?"}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            status === "Completed" && "bg-green-900/50 text-green-400",
                            status === "Active" && "bg-blue-900/50 text-blue-400",
                            status === "Stuck" && "bg-red-900/50 text-red-400",
                            status === "New" && "bg-slate-700 text-slate-300"
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(p.lastActiveAt)}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(p.startedAt)}</td>
                      </tr>
                    );
                  })}
                  {filteredParticipants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredMentors.map(u => (
                    <tr key={u.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-200">
                        {u.firstName || u.lastName 
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim() 
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-200">{u.email || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          u.role === "super_admin" ? "bg-purple-900/50 text-purple-400" : "bg-slate-700 text-slate-300"
                        )}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                  {filteredMentors.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
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
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Flow Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Drop Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredFlows.map(f => {
                    const dropRate = f.participantCount > 0 
                      ? Math.round((1 - f.completedCount / f.participantCount) * 100) 
                      : 0;
                    return (
                      <tr key={f.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3 font-medium text-slate-200">{f.name}</td>
                        <td className="px-4 py-3 text-slate-200">
                          {f.mentor?.firstName || f.mentor?.lastName 
                            ? `${f.mentor.firstName || ""} ${f.mentor.lastName || ""}`.trim()
                            : f.mentor?.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-200">{f.duration || 7}</td>
                        <td className="px-4 py-3 text-slate-200">{f.participantCount}</td>
                        <td className="px-4 py-3 text-slate-200">{f.completedCount}</td>
                        <td className="px-4 py-3">
                          {f.participantCount > 0 ? (
                            <span className={cn(
                              dropRate > 70 ? "text-red-400" : dropRate > 40 ? "text-yellow-400" : "text-green-400"
                            )}>
                              {dropRate}%
                            </span>
                          ) : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            f.status === "published" && "bg-green-900/50 text-green-400",
                            f.status === "draft" && "bg-slate-700 text-slate-300",
                            f.status === "error" && "bg-red-900/50 text-red-400"
                          )}>
                            {f.status || "draft"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFlows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              {errors && errors.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Message</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Resolved</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {errors.map(e => (
                      <tr key={e.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">
                            {e.errorType}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-md truncate text-slate-300" title={e.errorMessage}>
                          {e.errorMessage.slice(0, 100)}{e.errorMessage.length > 100 ? "..." : ""}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {e.relatedEntityType ? `${e.relatedEntityType}: ${e.relatedEntityId?.slice(0, 8)}` : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {e.resolved ? (
                            <span className="text-green-400">Yes</span>
                          ) : (
                            <span className="text-red-400">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDate(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-600" />
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
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 bg-slate-700 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
