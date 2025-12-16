import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Globe, Save, CreditCard, Receipt, XCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    website: "",
    specialty: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        bio: "",
        website: "",
        specialty: "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button asChild>
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-semibold text-primary">
              {formData.firstName?.[0] || formData.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-profile-title">
                {formData.firstName ? `${formData.firstName} ${formData.lastName}` : "My Profile"}
              </h1>
              <p className="text-muted-foreground text-sm">{formData.email}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-profile">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Personal Information</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Your first name"
                    className="border-0 border-b rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Your last name"
                    className="border-0 border-b rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="border-0 border-b rounded-none bg-transparent pl-6 focus-visible:ring-0 focus-visible:border-primary"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-border/50" />

          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Professional Details</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="specialty" className="text-xs text-muted-foreground">Specialty / Expertise</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g. Life Coach, Therapist, Meditation Teacher"
                  className="border-0 border-b rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
                  data-testid="input-specialty"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs text-muted-foreground">About You</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell participants about yourself and your expertise..."
                  rows={3}
                  className="border-0 border-b rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary resize-none"
                  data-testid="input-bio"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs text-muted-foreground">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="border-0 border-b rounded-none bg-transparent pl-6 focus-visible:ring-0 focus-visible:border-primary"
                    data-testid="input-website"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-border/50" />

          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Subscription & Billing</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Free Plan</p>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </div>
                  <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                    Active
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Premium plans coming soon with additional features and higher limits.
                </p>

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="text-sm text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
                      data-testid="button-cancel-subscription"
                    >
                      Cancel account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancel Your Account?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All your journeys</li>
                          <li>Participant data and progress</li>
                          <li>Your profile information</li>
                        </ul>
                        <p className="mt-3 font-medium text-foreground">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep My Account</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          window.location.href = "mailto:support@flow83.com?subject=Account%20Cancellation%20Request";
                        }}
                      >
                        Contact Support
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Invoices</p>
                    <p className="text-xs text-muted-foreground">Billing history</p>
                  </div>
                </div>
                
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No invoices yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your billing history will appear here
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
