import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Globe, Save, CreditCard, Receipt, XCircle, AlertTriangle, Camera } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
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
        bio: (user as any).bio || "",
        website: (user as any).website || "",
        specialty: (user as any).specialty || "",
      });
      setProfileImage((user as any).profileImageUrl || null);
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/profile/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image");
      }

      const data = await response.json();
      setProfileImage(data.profileImageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Please sign in</h1>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600">
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
            <div className="relative group">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 flex items-center justify-center text-2xl font-semibold text-white border border-white/10">
                  {formData.firstName?.[0] || formData.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <label 
                htmlFor="profile-image-upload" 
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </label>
              <input
                type="file"
                id="profile-image-upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
                data-testid="input-profile-image"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white" data-testid="text-profile-title">
                {formData.firstName ? `${formData.firstName} ${formData.lastName}` : "My Profile"}
              </h1>
              <p className="text-white/50 text-sm">{formData.email}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            data-testid="button-save-profile"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>

        <div className="space-y-8">
          <section className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-6">Personal Information</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs text-white/50">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Your first name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs text-white/50">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Your last name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-white/50">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl pl-10"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-6">Professional Details</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-xs text-white/50">Specialty / Expertise</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="e.g. Life Coach, Therapist, Meditation Teacher"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl"
                  data-testid="input-specialty"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs text-white/50">About You</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell participants about yourself and your expertise..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl resize-none"
                  data-testid="input-bio"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs text-white/50">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500/50 rounded-xl pl-10"
                    data-testid="input-website"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-6">Subscription & Billing</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Free Plan</p>
                    <p className="text-xs text-white/40">Currently active</p>
                  </div>
                  <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    Active
                  </span>
                </div>
                
                <p className="text-sm text-white/40 leading-relaxed">
                  Premium plans coming soon with additional features and higher limits.
                </p>

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="text-sm text-white/40 hover:text-red-400 transition-colors underline underline-offset-2"
                      data-testid="button-cancel-subscription"
                    >
                      Cancel account
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        Cancel Your Account?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/60">
                        This will permanently delete your account and all data including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>All your journeys</li>
                          <li>Participant data and progress</li>
                          <li>Your profile information</li>
                        </ul>
                        <p className="mt-3 font-medium text-white">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">Keep My Account</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 text-white hover:bg-red-700"
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-600/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Invoices</p>
                    <p className="text-xs text-white/40">Billing history</p>
                  </div>
                </div>
                
                <div className="py-6 text-center">
                  <p className="text-sm text-white/40">No invoices yet</p>
                  <p className="text-xs text-white/30 mt-1">
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
