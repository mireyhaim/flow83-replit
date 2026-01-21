import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Building2, 
  ArrowDownToLine, 
  Receipt, 
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type MentorBusinessProfile = {
  id: string;
  userId: string;
  businessName: string | null;
  businessType: string | null;
  businessId: string | null;
  vatRegistered: boolean | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessPostalCode: string | null;
  businessCountry: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  selfBillingAgreedAt: string | null;
  selfBillingAgreementVersion: string | null;
  verificationStatus: string | null;
};

type MentorWallet = {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  totalEarned: number;
  totalWithdrawn: number;
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  journeyName?: string;
  participantName?: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  type: string;
  total: number;
  currency: string;
  status: string;
  recipientName: string | null;
  issuerName: string | null;
  issuedAt: string | null;
  createdAt: string;
};

type MonthlyReport = {
  period: { year: number; month: number };
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
  transactions: WalletTransaction[];
};

export default function PaymentsPage() {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isHebrew = i18n.language === 'he';
  const [activeTab, setActiveTab] = useState("wallet");
  const [isSaving, setIsSaving] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    businessType: "osek_murshe",
    businessId: "",
    vatRegistered: false,
    businessAddress: "",
    businessCity: "",
    businessPostalCode: "",
    bankName: "",
    bankBranch: "",
    bankAccountNumber: "",
    bankAccountName: "",
    selfBillingAgreed: false,
    understandsLegalBinding: false,
    authorizesCollection: false,
  });

  const { data: businessProfile, isLoading: profileLoading } = useQuery<MentorBusinessProfile>({
    queryKey: ["/api/mentor/business-profile"],
  });

  useEffect(() => {
    if (businessProfile) {
      setBusinessForm({
        businessName: businessProfile.businessName || "",
        businessType: businessProfile.businessType || "osek_murshe",
        businessId: businessProfile.businessId || "",
        vatRegistered: businessProfile.vatRegistered || false,
        businessAddress: businessProfile.businessAddress || "",
        businessCity: businessProfile.businessCity || "",
        businessPostalCode: businessProfile.businessPostalCode || "",
        bankName: businessProfile.bankName || "",
        bankBranch: businessProfile.bankBranch || "",
        bankAccountNumber: businessProfile.bankAccountNumber || "",
        bankAccountName: businessProfile.bankAccountName || "",
        selfBillingAgreed: !!businessProfile.selfBillingAgreedAt,
        understandsLegalBinding: !!businessProfile.selfBillingAgreedAt,
        authorizesCollection: !!businessProfile.selfBillingAgreedAt,
      });
    }
  }, [businessProfile]);

  const { data: wallet, isLoading: walletLoading } = useQuery<MentorWallet>({
    queryKey: ["/api/mentor/wallet"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/mentor/wallet/transactions"],
  });

  const { data: monthlyReport, isLoading: reportLoading } = useQuery<MonthlyReport>({
    queryKey: ["/api/mentor/monthly-report", reportMonth.year, reportMonth.month],
    queryFn: async () => {
      const response = await fetch(`/api/mentor/monthly-report?year=${reportMonth.year}&month=${reportMonth.month}`);
      if (!response.ok) throw new Error("Failed to fetch report");
      return response.json();
    },
  });

  const saveBusinessProfileMutation = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      const response = await fetch("/api/mentor/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save business profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/business-profile"] });
      toast({
        title: isHebrew ? "הפרופיל העסקי נשמר" : "Business profile saved",
        description: isHebrew ? "הפרטים העסקיים שלך עודכנו בהצלחה" : "Your business details have been updated",
      });
    },
    onError: () => {
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: isHebrew ? "לא הצלחנו לשמור את הפרופיל העסקי" : "Failed to save business profile",
        variant: "destructive",
      });
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/mentor/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create withdrawal");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/withdrawals"] });
      toast({
        title: isHebrew ? "בקשת המשיכה נוצרה" : "Withdrawal request created",
        description: isHebrew 
          ? `חשבונית מספר ${data.invoice?.invoiceNumber} הופקה. העברה בנקאית תבוצע בימים הקרובים.`
          : `Invoice ${data.invoice?.invoiceNumber} generated. Bank transfer will be processed soon.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: isHebrew ? "שגיאה" : "Error",
        description: error.message === "Self-billing agreement required"
          ? (isHebrew ? "נדרש אישור הסכם Self-Billing בפרופיל העסקי" : "Self-billing agreement required in business profile")
          : error.message === "Business profile required for withdrawal"
          ? (isHebrew ? "נדרש להשלים את הפרופיל העסקי" : "Business profile required for withdrawal")
          : (isHebrew ? "לא הצלחנו ליצור את בקשת המשיכה" : "Failed to create withdrawal request"),
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isHebrew ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: wallet?.currency || 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getMonthName = (month: number) => {
    const monthNames = isHebrew
      ? ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month - 1];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setReportMonth(prev => {
      if (direction === 'prev') {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 };
        }
        return { year: prev.year, month: prev.month - 1 };
      } else {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 };
        }
        return { year: prev.year, month: prev.month + 1 };
      }
    });
  };

  const handleSaveBusinessProfile = async () => {
    if (!businessForm.selfBillingAgreed || !businessForm.understandsLegalBinding || !businessForm.authorizesCollection) {
      toast({
        title: isHebrew ? "נדרש אישור" : "Approval required",
        description: isHebrew ? "יש לסמן את כל התיבות לאישור הסכם ה-Self-Billing" : "You must check all boxes to agree to the Self-Billing agreement",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await saveBusinessProfileMutation.mutateAsync(businessForm);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
            {isHebrew ? "תשלומים והכנסות" : "Payments & Earnings"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isHebrew ? "נהל את ההכנסות, החשבוניות והמשיכות שלך" : "Manage your earnings, invoices, and withdrawals"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="wallet" className="gap-2" data-testid="tab-wallet">
              <Wallet className="h-4 w-4" />
              {isHebrew ? "ארנק" : "Wallet"}
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2" data-testid="tab-business">
              <Building2 className="h-4 w-4" />
              {isHebrew ? "פרופיל עסקי" : "Business Profile"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {isHebrew ? "יתרה זמינה" : "Available Balance"}
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-violet-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900" data-testid="text-balance">
                    {walletLoading ? "..." : formatCurrency(wallet?.balance || 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHebrew ? "זמין למשיכה" : "Available for withdrawal"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {isHebrew ? "סה\"כ הכנסות" : "Total Earnings"}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900" data-testid="text-total-earned">
                    {walletLoading ? "..." : formatCurrency(wallet?.totalEarned || 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHebrew ? "מתחילת הפעילות" : "Since you started"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {isHebrew ? "סה\"כ משיכות" : "Total Withdrawn"}
                  </CardTitle>
                  <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900" data-testid="text-total-withdrawn">
                    {walletLoading ? "..." : formatCurrency(wallet?.totalWithdrawn || 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isHebrew ? "הועבר לחשבונך" : "Transferred to your account"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isHebrew ? "בקש משיכה" : "Request Withdrawal"}</CardTitle>
                    <CardDescription>
                      {isHebrew 
                        ? "משוך את הכספים לחשבון הבנק שלך. חשבונית Self-Billing תופק אוטומטית." 
                        : "Withdraw funds to your bank account. A Self-Billing invoice will be generated automatically."}
                    </CardDescription>
                  </div>
                  <Button 
                    disabled={!wallet?.balance || wallet.balance < 100 || !businessProfile?.businessId || withdrawalMutation.isPending}
                    onClick={() => withdrawalMutation.mutate()}
                    data-testid="button-withdraw"
                  >
                    <ArrowDownToLine className="h-4 w-4 me-2" />
                    {withdrawalMutation.isPending 
                      ? (isHebrew ? "מעבד..." : "Processing...") 
                      : (isHebrew ? "בקש משיכה" : "Request Withdrawal")}
                  </Button>
                </div>
              </CardHeader>
              {!businessProfile?.businessId && (
                <CardContent>
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {isHebrew 
                        ? "עליך להשלים את הפרופיל העסקי כדי לבקש משיכה" 
                        : "Complete your business profile to request withdrawals"}
                    </span>
                    <Button 
                      variant="link" 
                      className="text-amber-700 p-0 h-auto"
                      onClick={() => setActiveTab("business")}
                    >
                      {isHebrew ? "השלם עכשיו" : "Complete now"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isHebrew ? "היסטוריית עסקאות" : "Transaction History"}</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8 text-slate-500">
                    {isHebrew ? "טוען..." : "Loading..."}
                  </div>
                ) : !transactions?.length ? (
                  <div className="text-center py-8 text-slate-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>{isHebrew ? "אין עסקאות עדיין" : "No transactions yet"}</p>
                    <p className="text-sm mt-1">
                      {isHebrew 
                        ? "כשמשתתפים ישלמו על ה-Flows שלך, העסקאות יופיעו כאן" 
                        : "When participants pay for your Flows, transactions will appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        data-testid={`transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'deposit' ? 'bg-green-100' : 
                            tx.type === 'withdrawal' ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            {tx.type === 'deposit' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : tx.type === 'withdrawal' ? (
                              <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{tx.description}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(tx.createdAt).toLocaleDateString(isHebrew ? 'he-IL' : 'en-US')}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          tx.amount > 0 ? 'text-green-600' : 'text-slate-900'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-600" />
                    {isHebrew ? "דו\"ח חודשי" : "Monthly Report"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => navigateMonth('prev')}
                      data-testid="button-prev-month"
                    >
                      {isHebrew ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <span className="font-medium min-w-[140px] text-center">
                      {getMonthName(reportMonth.month)} {reportMonth.year}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => navigateMonth('next')}
                      disabled={reportMonth.year === new Date().getFullYear() && reportMonth.month === new Date().getMonth() + 1}
                      data-testid="button-next-month"
                    >
                      {isHebrew ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="text-center py-8 text-slate-500">
                    {isHebrew ? "טוען..." : "Loading..."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-sm text-green-700 mb-1">
                          {isHebrew ? "הכנסות" : "Deposits"}
                        </p>
                        <p className="text-xl font-bold text-green-800" data-testid="text-monthly-deposits">
                          {formatCurrency(monthlyReport?.totalDeposits || 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-700 mb-1">
                          {isHebrew ? "משיכות" : "Withdrawals"}
                        </p>
                        <p className="text-xl font-bold text-blue-800" data-testid="text-monthly-withdrawals">
                          {formatCurrency(monthlyReport?.totalWithdrawals || 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">
                          {isHebrew ? "מספר עסקאות" : "Transactions"}
                        </p>
                        <p className="text-xl font-bold text-slate-800" data-testid="text-monthly-count">
                          {monthlyReport?.transactionCount || 0}
                        </p>
                      </div>
                    </div>
                    
                    {monthlyReport?.transactions && monthlyReport.transactions.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-slate-700 mb-3">
                            {isHebrew ? "עסקאות בחודש" : "Transactions this month"}
                          </h4>
                          <div className="space-y-2">
                            {monthlyReport.transactions.map((tx) => (
                              <div 
                                key={tx.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={tx.amount > 0 ? 'text-green-600' : 'text-blue-600'}>
                                    {tx.type === 'deposit' ? '↑' : '↓'}
                                  </span>
                                  <span className="text-slate-700">{tx.description}</span>
                                </div>
                                <span className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-slate-700'}`}>
                                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {(!monthlyReport?.transactions || monthlyReport.transactions.length === 0) && (
                      <div className="text-center py-4 text-slate-500">
                        <p>{isHebrew ? "אין עסקאות בחודש זה" : "No transactions this month"}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isHebrew ? "פרטי העסק" : "Business Details"}</CardTitle>
                <CardDescription>
                  {isHebrew 
                    ? "פרטים אלו ישמשו להפקת חשבוניות ולהעברת כספים" 
                    : "These details will be used for invoices and fund transfers"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      {isHebrew ? "שם העסק" : "Business Name"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                      placeholder={isHebrew ? "שם העסק הרשום" : "Registered business name"}
                      data-testid="input-business-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">
                      {isHebrew ? "סוג העסק" : "Business Type"} <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={businessForm.businessType} 
                      onValueChange={(value) => setBusinessForm({ ...businessForm, businessType: value })}
                    >
                      <SelectTrigger data-testid="select-business-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="osek_murshe">{isHebrew ? "עוסק מורשה" : "Licensed Dealer"}</SelectItem>
                        <SelectItem value="osek_patur">{isHebrew ? "עוסק פטור" : "Exempt Dealer"}</SelectItem>
                        <SelectItem value="company">{isHebrew ? "חברה בע\"מ" : "Company (Ltd)"}</SelectItem>
                        <SelectItem value="amuta">{isHebrew ? "עמותה" : "Non-profit"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessId">
                      {isHebrew ? "מספר עוסק / ח\"פ" : "Tax ID / Business Number"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessId"
                      value={businessForm.businessId}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessId: e.target.value })}
                      placeholder={isHebrew ? "9 ספרות" : "9 digits"}
                      maxLength={9}
                      data-testid="input-business-id"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="vatRegistered"
                      checked={businessForm.vatRegistered}
                      onCheckedChange={(checked) => setBusinessForm({ ...businessForm, vatRegistered: !!checked })}
                      data-testid="checkbox-vat"
                    />
                    <Label htmlFor="vatRegistered" className="cursor-pointer">
                      {isHebrew ? "רשום/ה למע\"מ" : "VAT Registered"}
                    </Label>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">{isHebrew ? "כתובת העסק" : "Business Address"}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessAddress">{isHebrew ? "כתובת" : "Address"}</Label>
                      <Input
                        id="businessAddress"
                        value={businessForm.businessAddress}
                        onChange={(e) => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
                        placeholder={isHebrew ? "רחוב ומספר" : "Street and number"}
                        data-testid="input-business-address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessCity">{isHebrew ? "עיר" : "City"}</Label>
                      <Input
                        id="businessCity"
                        value={businessForm.businessCity}
                        onChange={(e) => setBusinessForm({ ...businessForm, businessCity: e.target.value })}
                        data-testid="input-business-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPostalCode">{isHebrew ? "מיקוד" : "Postal Code"}</Label>
                      <Input
                        id="businessPostalCode"
                        value={businessForm.businessPostalCode}
                        onChange={(e) => setBusinessForm({ ...businessForm, businessPostalCode: e.target.value })}
                        data-testid="input-business-postal"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">{isHebrew ? "פרטי בנק למשיכות" : "Bank Details for Withdrawals"}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">
                        {isHebrew ? "שם הבנק" : "Bank Name"} <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={businessForm.bankName} 
                        onValueChange={(value) => setBusinessForm({ ...businessForm, bankName: value })}
                      >
                        <SelectTrigger data-testid="select-bank">
                          <SelectValue placeholder={isHebrew ? "בחר בנק" : "Select bank"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hapoalim">{isHebrew ? "בנק הפועלים" : "Bank Hapoalim"}</SelectItem>
                          <SelectItem value="leumi">{isHebrew ? "בנק לאומי" : "Bank Leumi"}</SelectItem>
                          <SelectItem value="discount">{isHebrew ? "בנק דיסקונט" : "Discount Bank"}</SelectItem>
                          <SelectItem value="mizrachi">{isHebrew ? "מזרחי טפחות" : "Mizrahi Tefahot"}</SelectItem>
                          <SelectItem value="fibi">{isHebrew ? "הבנק הבינלאומי" : "First International"}</SelectItem>
                          <SelectItem value="yahav">{isHebrew ? "בנק יהב" : "Bank Yahav"}</SelectItem>
                          <SelectItem value="mercantile">{isHebrew ? "מרכנתיל" : "Mercantile"}</SelectItem>
                          <SelectItem value="other">{isHebrew ? "אחר" : "Other"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankBranch">
                        {isHebrew ? "מספר סניף" : "Branch Number"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankBranch"
                        value={businessForm.bankBranch}
                        onChange={(e) => setBusinessForm({ ...businessForm, bankBranch: e.target.value })}
                        placeholder={isHebrew ? "3 ספרות" : "3 digits"}
                        maxLength={3}
                        data-testid="input-bank-branch"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">
                        {isHebrew ? "מספר חשבון" : "Account Number"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankAccountNumber"
                        value={businessForm.bankAccountNumber}
                        onChange={(e) => setBusinessForm({ ...businessForm, bankAccountNumber: e.target.value })}
                        data-testid="input-bank-account"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">
                        {isHebrew ? "שם בעל החשבון" : "Account Holder Name"} <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="bankAccountName"
                        value={businessForm.bankAccountName}
                        onChange={(e) => setBusinessForm({ ...businessForm, bankAccountName: e.target.value })}
                        data-testid="input-bank-name"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveBusinessProfile}
                    disabled={isSaving}
                    className="bg-violet-600 hover:bg-violet-700"
                    data-testid="button-save-business"
                  >
                    {isSaving 
                      ? (isHebrew ? "שומר..." : "Saving...") 
                      : (isHebrew ? "אני מאשר/ת ומפעיל/ה גבייה" : "I approve and activate collection")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {businessProfile?.verificationStatus && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {businessProfile.verificationStatus === 'verified' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">
                            {isHebrew ? "הפרופיל העסקי מאומת" : "Business profile verified"}
                          </p>
                          <p className="text-sm text-green-600">
                            {isHebrew ? "ניתן לבקש משיכות" : "You can request withdrawals"}
                          </p>
                        </div>
                      </>
                    ) : businessProfile.verificationStatus === 'pending' ? (
                      <>
                        <Clock className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800">
                            {isHebrew ? "ממתין לאימות" : "Pending verification"}
                          </p>
                          <p className="text-sm text-amber-600">
                            {isHebrew ? "נבדוק את הפרטים בהקדם" : "We'll review your details soon"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">
                            {isHebrew ? "נדרש תיקון" : "Correction needed"}
                          </p>
                          <p className="text-sm text-red-600">
                            {isHebrew ? "אנא עדכן את הפרטים ושלח שוב" : "Please update your details and resubmit"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
