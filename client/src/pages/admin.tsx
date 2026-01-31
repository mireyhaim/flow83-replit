import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Layers, 
  AlertTriangle,
  Search,
  RefreshCw,
  ChevronLeft,
  Lock,
  LogOut,
  Loader2,
  Wallet,
  RotateCcw,
  CreditCard,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownToLine,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "x-admin-token": token || "",
    },
  });
}

type TabType = "dashboard" | "users" | "mentors" | "flows" | "pending-flows" | "withdrawals" | "refunds" | "payments" | "errors";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMentors: number;
  activeFlows: number;
  journeysStarted30d: number;
  journeysCompleted30d: number;
}

interface PlatformStats {
  totalMentors: number;
  activeMentors: number;
  newMentorsToday: number;
  totalParticipants: number;
  activeParticipants: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingWithdrawals: number;
  pendingRefunds: number;
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
  subscriptionPlan: string | null;
}

interface Flow {
  id: string;
  name: string;
  status: string | null;
  duration: number | null;
  createdAt: string | null;
  mentor: { firstName: string | null; lastName: string | null; email: string | null } | null;
  participantCount: number;
  completedCount: number;
}

interface PendingFlow {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  approvalStatus: string | null;
  adminPaymentUrl: string | null;
  submittedForApprovalAt: string | null;
  shortCode: string | null;
  mentor: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
}

interface WithdrawalRequest {
  id: string;
  mentorId: string;
  amount: number;
  currency: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
  transactionReference: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNumber: string | null;
  mentor: { firstName: string | null; lastName: string | null; email: string | null } | null;
}

interface RefundRequest {
  id: string;
  mentorId: string;
  type: string;
  amount: number;
  reason: string | null;
  participantEmail: string | null;
  participantName: string | null;
  status: string;
  adminNotes: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  mentor: { firstName: string | null; lastName: string | null; email: string | null } | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  commissionRate: number | null;
  commissionAmount: number | null;
  netAmount: number | null;
  createdAt: string;
  mentor: { firstName: string | null; lastName: string | null; email: string | null } | null;
  journey: { name: string } | null;
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [actionForm, setActionForm] = useState({ reason: "", reference: "", notes: "" });
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedPendingFlow, setSelectedPendingFlow] = useState<PendingFlow | null>(null);
  const [paymentLinkInput, setPaymentLinkInput] = useState("");
  const [flowActivated, setFlowActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activatedFlowLink, setActivatedFlowLink] = useState<string>("");

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

  const { data: platformStats, refetch: refetchPlatformStats } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/platform-stats"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/platform-stats");
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
    enabled: isAuthenticated === true,
  });

  const { data: pendingFlows, refetch: refetchPendingFlows } = useQuery<PendingFlow[]>({
    queryKey: ["/api/admin/pending-flows"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/pending-flows");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/admin/withdrawal-requests"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/withdrawal-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: refunds, refetch: refetchRefunds } = useQuery<RefundRequest[]>({
    queryKey: ["/api/admin/refund-requests"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/refund-requests");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: payments, refetch: refetchPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/payments");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: errors, refetch: refetchErrors } = useQuery<SystemError[]>({
    queryKey: ["/api/admin/errors"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/errors");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason, transactionReference }: { id: string; status: string; rejectionReason?: string; transactionReference?: string }) => {
      const res = await adminFetch(`/api/admin/withdrawal-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason, transactionReference }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-stats"] });
      setSelectedWithdrawal(null);
      setActionForm({ reason: "", reference: "", notes: "" });
    },
  });

  const updateRefundMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const res = await adminFetch(`/api/admin/refund-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-stats"] });
      setSelectedRefund(null);
      setActionForm({ reason: "", reference: "", notes: "" });
    },
  });

  const updateMentorPlanMutation = useMutation({
    mutationFn: async ({ id, subscriptionPlan }: { id: string; subscriptionPlan: string }) => {
      const res = await adminFetch(`/api/admin/users/${id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ subscriptionPlan }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedMentor(null);
    },
  });

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

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

  const pendingWithdrawals = withdrawals?.filter(w => w.status === "pending") || [];
  const pendingRefunds = refunds?.filter(r => r.status === "pending") || [];
  const awaitingApprovalFlows = pendingFlows?.filter(f => f.approvalStatus === "pending_approval") || [];
  const newMentorsToday = platformStats?.newMentorsToday || 0;
  const totalPendingNotifications = pendingWithdrawals.length + pendingRefunds.length + newMentorsToday + awaitingApprovalFlows.length;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" />, count: platformStats?.totalParticipants },
    { id: "mentors", label: "Mentors", icon: <UserCog className="w-4 h-4" />, count: platformStats?.totalMentors, badge: newMentorsToday },
    { id: "flows", label: "Flows", icon: <Layers className="w-4 h-4" />, count: flows?.length },
    { id: "pending-flows", label: "Pending Flows", icon: <Clock className="w-4 h-4" />, count: pendingFlows?.length, badge: awaitingApprovalFlows.length },
    { id: "withdrawals", label: "Withdrawals", icon: <ArrowDownToLine className="w-4 h-4" />, count: withdrawals?.length, badge: pendingWithdrawals.length },
    { id: "refunds", label: "Refunds", icon: <RotateCcw className="w-4 h-4" />, count: refunds?.length, badge: pendingRefunds.length },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, count: payments?.length },
    { id: "errors", label: "Errors", icon: <AlertTriangle className="w-4 h-4" />, count: errors?.length },
  ];

  const handleRefresh = () => {
    if (activeTab === "dashboard") { refetchStats(); refetchPlatformStats(); refetchWithdrawals(); refetchRefunds(); refetchPendingFlows(); }
    if (activeTab === "users") refetchParticipants();
    if (activeTab === "mentors") refetchMentors();
    if (activeTab === "flows") refetchFlows();
    if (activeTab === "pending-flows") refetchPendingFlows();
    if (activeTab === "withdrawals") refetchWithdrawals();
    if (activeTab === "refunds") refetchRefunds();
    if (activeTab === "payments") refetchPayments();
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

  const formatCurrency = (amount: number) => {
    return `₪${(amount / 100).toFixed(2)}`;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case "free":
        return <Badge className="bg-slate-500/20 text-slate-400">Free</Badge>;
      case "pro":
        return <Badge className="bg-violet-500/20 text-violet-400">Pro</Badge>;
      case "scale":
        return <Badge className="bg-amber-500/20 text-amber-400">Scale</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <aside className="w-56 bg-slate-950 min-h-screen p-4 flex flex-col border-r border-slate-800">
          <div className="mb-8">
            <h1 className="text-white font-bold text-lg">Flow83 Admin</h1>
            <p className="text-slate-400 text-xs">Internal Dashboard</p>
          </div>
          
          {totalPendingNotifications > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <Bell className="w-4 h-4" />
                {totalPendingNotifications} pending requests
              </div>
            </div>
          )}
          
          <nav className="space-y-1 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm transition-colors",
                  activeTab === tab.id 
                    ? "bg-slate-700 text-white" 
                    : "text-slate-300 hover:bg-slate-700/50"
                )}
                data-testid={`tab-${tab.id}`}
              >
                <span className="flex items-center gap-3">
                  {tab.count !== undefined && (
                    <span className="text-slate-400 font-medium min-w-[24px] text-right">{tab.count}</span>
                  )}
                  {tab.icon}
                  {tab.label}
                </span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
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

        <main className="flex-1 p-6">
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

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Revenue" value={formatCurrency(platformStats?.totalRevenue || 0)} loading={!platformStats} icon={<TrendingUp className="w-5 h-5" />} />
                <StatCard label="Total Commissions" value={formatCurrency(platformStats?.totalCommissions || 0)} loading={!platformStats} icon={<DollarSign className="w-5 h-5" />} />
                <StatCard label="Pending Withdrawals" value={platformStats?.pendingWithdrawals ?? 0} loading={!platformStats} icon={<ArrowDownToLine className="w-5 h-5" />} highlight={!!(platformStats?.pendingWithdrawals && platformStats.pendingWithdrawals > 0)} />
                <StatCard label="Pending Refunds" value={platformStats?.pendingRefunds ?? 0} loading={!platformStats} icon={<RotateCcw className="w-5 h-5" />} highlight={!!(platformStats?.pendingRefunds && platformStats.pendingRefunds > 0)} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Total Users" value={stats?.totalUsers ?? 0} loading={statsLoading} />
                <StatCard label="Active Users (7d)" value={stats?.activeUsers ?? 0} loading={statsLoading} />
                <StatCard label="Total Mentors" value={platformStats?.totalMentors ?? 0} loading={!platformStats} />
                <StatCard label="Active Mentors" value={platformStats?.activeMentors ?? 0} loading={!platformStats} />
                <StatCard label="New Mentors (24h)" value={platformStats?.newMentorsToday ?? 0} loading={!platformStats} highlight={!!(platformStats?.newMentorsToday && platformStats.newMentorsToday > 0)} />
                <StatCard label="Total Participants" value={platformStats?.totalParticipants ?? 0} loading={!platformStats} />
                <StatCard label="Active Participants" value={platformStats?.activeParticipants ?? 0} loading={!platformStats} />
              </div>

              {newMentorsToday > 0 && (
                <div className="bg-slate-800 rounded-lg border border-green-500/30 p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-green-400" />
                    New Mentors Today ({newMentorsToday})
                  </h3>
                  <p className="text-slate-400 text-sm mb-2">New mentors joined in the last 24 hours</p>
                  <Button size="sm" onClick={() => setActiveTab("mentors")}>View Mentors</Button>
                </div>
              )}

              {pendingWithdrawals.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-amber-500/30 p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4 text-amber-400" />
                    Pending Withdrawal Requests ({pendingWithdrawals.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingWithdrawals.slice(0, 3).map(w => (
                      <div key={w.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                        <div>
                          <p className="text-white font-medium">{w.mentor?.firstName} {w.mentor?.lastName}</p>
                          <p className="text-slate-400 text-sm">{formatCurrency(w.amount)}</p>
                        </div>
                        <Button size="sm" onClick={() => { setActiveTab("withdrawals"); setSelectedWithdrawal(w); }}>Review</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingRefunds.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-amber-500/30 p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    Pending Refund Requests ({pendingRefunds.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRefunds.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                        <div>
                          <p className="text-white font-medium">{r.mentor?.firstName} {r.mentor?.lastName}</p>
                          <p className="text-slate-400 text-sm">{formatCurrency(r.amount)} - {r.participantName || r.participantEmail}</p>
                        </div>
                        <Button size="sm" onClick={() => { setActiveTab("refunds"); setSelectedRefund(r); }}>Review</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {activeTab === "mentors" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
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
                      <td className="px-4 py-3">{getPlanBadge(u.subscriptionPlan)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          u.role === "super_admin" ? "bg-purple-900/50 text-purple-400" : "bg-slate-700 text-slate-300"
                        )}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelectedMentor(u)} className="text-xs border-slate-600">
                          Change Plan
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredMentors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "flows" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Flow Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Created</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Days</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredFlows.map(f => (
                    <tr key={f.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-200">{f.name}</td>
                      <td className="px-4 py-3 text-slate-200">
                        {f.mentor?.firstName || f.mentor?.lastName 
                          ? `${f.mentor.firstName || ""} ${f.mentor.lastName || ""}`.trim()
                          : f.mentor?.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('he-IL') : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-200">{f.duration || 7}</td>
                      <td className="px-4 py-3 text-slate-200">{f.participantCount}</td>
                      <td className="px-4 py-3 text-slate-200">{f.completedCount}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          f.status === "published" && "bg-green-900/50 text-green-400",
                          f.status === "draft" && "bg-slate-700 text-slate-300"
                        )}>
                          {f.status || "draft"}
                        </span>
                      </td>
                    </tr>
                  ))}
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

          {activeTab === "pending-flows" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Flow Name</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Price</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Submitted</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pendingFlows?.map(pf => (
                    <tr key={pf.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-200">{pf.name}</td>
                      <td className="px-4 py-3 text-slate-200">
                        <div>
                          <p className="font-medium">{pf.mentor?.firstName || ""} {pf.mentor?.lastName || ""}</p>
                          <p className="text-slate-400 text-xs">{pf.mentor?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {pf.price && pf.price > 0 ? `₪${pf.price}` : "Free"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {pf.submittedForApprovalAt ? new Date(pf.submittedForApprovalAt).toLocaleDateString('he-IL') : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          pf.approvalStatus === "pending_approval" && "bg-amber-900/50 text-amber-400",
                          pf.approvalStatus === "approved" && "bg-green-900/50 text-green-400"
                        )}>
                          {pf.approvalStatus === "pending_approval" ? "Pending" : pf.approvalStatus === "approved" ? "Approved" : pf.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => { 
                            setSelectedPendingFlow(pf); 
                            setPaymentLinkInput(pf.adminPaymentUrl || ""); 
                            setFlowActivated(false);
                            setActivatedFlowLink("");
                          }}
                          className="bg-violet-600 hover:bg-violet-700"
                          data-testid={`button-review-flow-${pf.id}`}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!pendingFlows || pendingFlows.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No pending flows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Bank Details</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Requested</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {withdrawals?.map(w => (
                    <tr key={w.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-200">
                        <div>
                          <p className="font-medium">{w.mentor?.firstName} {w.mentor?.lastName}</p>
                          <p className="text-slate-400 text-xs">{w.mentor?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{formatCurrency(w.amount)}</td>
                      <td className="px-4 py-3 text-slate-200">
                        <div className="text-xs">
                          <p>{w.bankName} - Branch {w.bankBranch}</p>
                          <p className="text-slate-400">Account: {w.bankAccountNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(w.status)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(w.requestedAt)}</td>
                      <td className="px-4 py-3">
                        {w.status === "pending" && (
                          <Button size="sm" onClick={() => setSelectedWithdrawal(w)} data-testid={`btn-review-withdrawal-${w.id}`}>
                            Review
                          </Button>
                        )}
                        {w.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => setSelectedWithdrawal(w)} className="border-slate-600">
                            Mark Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!withdrawals || withdrawals.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No withdrawal requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "refunds" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Participant</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {refunds?.map(r => (
                    <tr key={r.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-200">
                        <div>
                          <p className="font-medium">{r.mentor?.firstName} {r.mentor?.lastName}</p>
                          <p className="text-slate-400 text-xs">{r.mentor?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        <div>
                          <p>{r.participantName || "-"}</p>
                          <p className="text-slate-400 text-xs">{r.participantEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={r.type === "refund" ? "text-blue-400" : "text-orange-400"}>
                          {r.type === "refund" ? "Refund" : "Cancellation"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{formatCurrency(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{r.reason || "-"}</td>
                      <td className="px-4 py-3">{getStatusBadge(r.status)}</td>
                      <td className="px-4 py-3">
                        {r.status === "pending" && (
                          <Button size="sm" onClick={() => setSelectedRefund(r)} data-testid={`btn-review-refund-${r.id}`}>
                            Review
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!refunds || refunds.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No refund requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Mentor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Journey</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Commission</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Net</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {payments?.map(p => (
                    <tr key={p.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-200">
                        <div>
                          <p className="font-medium">{p.mentor?.firstName} {p.mentor?.lastName}</p>
                          <p className="text-slate-400 text-xs">{p.mentor?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{p.journey?.name || "-"}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-red-400">
                        {p.commissionAmount ? `-${formatCurrency(p.commissionAmount)}` : "-"}
                        {p.commissionRate && <span className="text-slate-500 text-xs ml-1">({p.commissionRate}%)</span>}
                      </td>
                      <td className="px-4 py-3 text-green-400 font-medium">
                        {p.netAmount ? formatCurrency(p.netAmount) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          p.status === "completed" && "bg-green-900/50 text-green-400",
                          p.status === "pending" && "bg-yellow-900/50 text-yellow-400",
                          p.status === "failed" && "bg-red-900/50 text-red-400"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                  {(!payments || payments.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "errors" && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Message</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {errors?.map(e => (
                    <tr key={e.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">
                          {e.errorType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 max-w-[400px] truncate">{e.errorMessage}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {e.relatedEntityType ? `${e.relatedEntityType}: ${e.relatedEntityId?.substring(0, 8)}...` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          e.resolved ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"
                        )}>
                          {e.resolved ? "Resolved" : "Open"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(e.createdAt)}</td>
                    </tr>
                  ))}
                  {(!errors || errors.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No errors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => { setSelectedWithdrawal(null); setActionForm({ reason: "", reference: "", notes: "" }); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Review Withdrawal Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedWithdrawal?.mentor?.firstName} {selectedWithdrawal?.mentor?.lastName} - {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank:</span>
                <span>{selectedWithdrawal?.bankName} - Branch {selectedWithdrawal?.bankBranch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span>{selectedWithdrawal?.bankAccountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span>{selectedWithdrawal?.status}</span>
              </div>
            </div>

            {selectedWithdrawal?.status === "pending" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Rejection reason (if rejecting)</Label>
                <Textarea
                  value={actionForm.reason}
                  onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for rejection..."
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            )}

            {selectedWithdrawal?.status === "approved" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Transaction Reference</Label>
                <Input
                  value={actionForm.reference}
                  onChange={(e) => setActionForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Bank transfer reference..."
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {selectedWithdrawal?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedWithdrawal) {
                      updateWithdrawalMutation.mutate({
                        id: selectedWithdrawal.id,
                        status: "rejected",
                        rejectionReason: actionForm.reason,
                      });
                    }
                  }}
                  disabled={updateWithdrawalMutation.isPending}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (selectedWithdrawal) {
                      updateWithdrawalMutation.mutate({
                        id: selectedWithdrawal.id,
                        status: "approved",
                      });
                    }
                  }}
                  disabled={updateWithdrawalMutation.isPending}
                >
                  Approve
                </Button>
              </>
            )}
            {selectedWithdrawal?.status === "approved" && (
              <Button
                onClick={() => {
                  if (selectedWithdrawal) {
                    updateWithdrawalMutation.mutate({
                      id: selectedWithdrawal.id,
                      status: "completed",
                      transactionReference: actionForm.reference,
                    });
                  }
                }}
                disabled={updateWithdrawalMutation.isPending}
              >
                Mark as Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRefund} onOpenChange={() => { setSelectedRefund(null); setActionForm({ reason: "", reference: "", notes: "" }); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Review Refund Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedRefund?.type === "refund" ? "Refund" : "Cancellation"} - {selectedRefund && formatCurrency(selectedRefund.amount)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mentor:</span>
                <span>{selectedRefund?.mentor?.firstName} {selectedRefund?.mentor?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Participant:</span>
                <span>{selectedRefund?.participantName || selectedRefund?.participantEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reason:</span>
                <span className="max-w-[200px] truncate">{selectedRefund?.reason || "-"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Admin Notes</Label>
              <Textarea
                value={actionForm.notes}
                onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes..."
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRefund) {
                  updateRefundMutation.mutate({
                    id: selectedRefund.id,
                    status: "rejected",
                    adminNotes: actionForm.notes,
                  });
                }
              }}
              disabled={updateRefundMutation.isPending}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedRefund) {
                  updateRefundMutation.mutate({
                    id: selectedRefund.id,
                    status: "approved",
                    adminNotes: actionForm.notes,
                  });
                }
              }}
              disabled={updateRefundMutation.isPending}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPendingFlow} onOpenChange={() => { setSelectedPendingFlow(null); setPaymentLinkInput(""); setFlowActivated(false); setActivatedFlowLink(""); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{flowActivated ? "צפייה ואישור" : "הפעלת מיני-סייט"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              <span className="font-medium text-white">{selectedPendingFlow?.name}</span>
              <span className="mx-2">•</span>
              <span>{selectedPendingFlow?.mentor?.firstName} {selectedPendingFlow?.mentor?.lastName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mentor:</span>
                <span>{selectedPendingFlow?.mentor?.firstName} {selectedPendingFlow?.mentor?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span>{selectedPendingFlow?.mentor?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price:</span>
                <span>{selectedPendingFlow?.price && selectedPendingFlow.price > 0 ? `₪${selectedPendingFlow.price}` : "Free"}</span>
              </div>
            </div>

            {!flowActivated ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">לינק תשלום Grow (נדרש עבור פלואו בתשלום)</Label>
                  <Input
                    value={paymentLinkInput}
                    onChange={(e) => setPaymentLinkInput(e.target.value)}
                    placeholder="https://grow.link/... or https://meshulam.co.il/..."
                    className="bg-slate-700 border-slate-600"
                    data-testid="input-admin-payment-link"
                  />
                </div>
                <p className="text-sm text-slate-400">
                  לחיצה על "הפעל מיני-סייט" תפרסם את ה-Flow ותאפשר לך לצפות בו לפני שליחת המייל למנטור.
                </p>
                {selectedPendingFlow?.price && selectedPendingFlow.price > 0 && !paymentLinkInput && (
                  <p className="text-sm text-amber-400 mt-2">
                    ⚠️ חובה להזין לינק תשלום עבור פלואו בתשלום
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                  <p className="text-green-400 font-medium mb-2">✅ המיני-סייט מוכן!</p>
                  <p className="text-sm text-slate-300 mb-3">לחץ על הלינק כדי לצפות במיני-סייט לפני שליחת המייל למנטור:</p>
                  {activatedFlowLink ? (
                    <a 
                      href={activatedFlowLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 underline break-all"
                      data-testid="link-mini-site-preview"
                    >
                      {activatedFlowLink}
                    </a>
                  ) : (
                    <span className="text-slate-400">לינק לא זמין - נסה לרענן את הדף</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setSelectedPendingFlow(null); setPaymentLinkInput(""); setFlowActivated(false); setActivatedFlowLink(""); }}
              className="border-slate-600"
            >
              סגור
            </Button>
            {!flowActivated ? (
              <Button
                onClick={async () => {
                  alert("Button clicked! Flow: " + selectedPendingFlow?.id + ", Link: " + paymentLinkInput);
                  console.log("Button clicked! selectedPendingFlow:", selectedPendingFlow?.id, "paymentLinkInput:", paymentLinkInput);
                  if (!selectedPendingFlow) return;
                  setIsActivating(true);
                  console.log("Starting activate request...");
                  try {
                    const res = await adminFetch(`/api/admin/flows/${selectedPendingFlow.id}/activate`, {
                      method: "POST",
                      body: JSON.stringify({ adminPaymentUrl: paymentLinkInput }),
                    });
                    console.log("Activate response:", res.status, res.ok);
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => ({}));
                      throw new Error(errorData.error || "Failed to activate");
                    }
                    const data = await res.json();
                    setActivatedFlowLink(data.miniSiteUrl || "");
                    await refetchPendingFlows();
                    setFlowActivated(true);
                    toast({
                      title: "✅ המיני-סייט הופעל!",
                      description: "עכשיו אפשר לשלוח למנטור",
                    });
                  } catch (error: any) {
                    console.error("Failed to activate flow:", error);
                    toast({
                      title: "שגיאה בהפעלה",
                      description: error?.message || "נסה שוב",
                      variant: "destructive",
                    });
                  } finally {
                    setIsActivating(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!!(selectedPendingFlow?.price && selectedPendingFlow.price > 0 && !paymentLinkInput) || isActivating}
                data-testid="button-activate-minisite"
              >
                {isActivating ? "מפעיל..." : "הפעל מיני-סייט"}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (!selectedPendingFlow) return;
                  try {
                    const res = await adminFetch(`/api/admin/flows/${selectedPendingFlow.id}/approve`, {
                      method: "POST",
                    });
                    if (!res.ok) throw new Error("Failed to send");
                    refetchPendingFlows();
                    setSelectedPendingFlow(null);
                    setPaymentLinkInput("");
                    setFlowActivated(false);
                    toast({
                      title: "✅ נשלח בהצלחה!",
                      description: "המייל נשלח למנטור והסטטוס עודכן לפורסם",
                    });
                  } catch (error) {
                    console.error("Failed to send to mentor:", error);
                    toast({
                      title: "שגיאה",
                      description: "השליחה נכשלה, נסה שוב",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-violet-600 hover:bg-violet-700"
                data-testid="button-send-to-mentor"
              >
                שלח למנטור
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Change Mentor Plan</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedMentor?.firstName} {selectedMentor?.lastName} ({selectedMentor?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Current Plan</Label>
              <div>{getPlanBadge(selectedMentor?.subscriptionPlan || null)}</div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">New Plan</Label>
              <Select
                defaultValue={selectedMentor?.subscriptionPlan || "free"}
                onValueChange={(value) => {
                  if (selectedMentor) {
                    updateMentorPlanMutation.mutate({
                      id: selectedMentor.id,
                      subscriptionPlan: value,
                    });
                  }
                }}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (17% commission)</SelectItem>
                  <SelectItem value="pro">Pro (15% commission)</SelectItem>
                  <SelectItem value="scale">Scale (11% commission)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  loading = false, 
  icon,
  highlight = false 
}: { 
  label: string; 
  value: number | string; 
  loading?: boolean;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "bg-slate-800 rounded-lg p-4 border",
      highlight ? "border-amber-500/50" : "border-slate-700"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{label}</p>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-slate-700 animate-pulse rounded mt-1" />
      ) : (
        <p className={cn(
          "text-2xl font-bold mt-1",
          highlight ? "text-amber-400" : "text-white"
        )}>
          {value}
        </p>
      )}
    </div>
  );
}
