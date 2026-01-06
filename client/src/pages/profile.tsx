import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Globe, Save, CreditCard, XCircle, Camera, CheckCircle2, AlertTriangle } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation('dashboard');
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    website: "",
    specialty: "",
    methodology: "",
    uniqueApproach: "",
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
        methodology: (user as any).methodology || "",
        uniqueApproach: (user as any).uniqueApproach || "",
      });
      setProfileImage((user as any).profileImageUrl || null);
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('profilePage.fileTooLarge'),
        description: t('profilePage.fileTooLargeDesc'),
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
        throw new Error(error.message || t('profilePage.failedToUploadImage'));
      }

      const data = await response.json();
      setProfileImage(data.profileImageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: t('profilePage.imageUploaded'),
        description: t('profilePage.imageUploadedDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('profilePage.failedToUploadImage'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Helper to check if text contains only Hebrew characters and spaces
  const isHebrewOnly = (text: string) => {
    const hebrewPattern = /^[\u0590-\u05FF\s]+$/;
    return hebrewPattern.test(text);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: t('error'),
        description: t('profilePage.nameRequired'),
        variant: "destructive",
      });
      return;
    }
    
    // For Hebrew users, validate that names are in Hebrew only
    if (i18n.language === 'he') {
      if (!isHebrewOnly(formData.firstName.trim()) || !isHebrewOnly(formData.lastName.trim())) {
        toast({
          title: t('error'),
          description: t('profilePage.hebrewNameRequired'),
          variant: "destructive",
        });
        return;
      }
    }
    
    // Profile image is required
    if (!profileImage) {
      toast({
        title: t('error'),
        description: t('profilePage.imageRequired'),
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.specialty.trim()) {
      toast({
        title: t('error'),
        description: t('profilePage.specialtyRequired'),
        variant: "destructive",
      });
      return;
    }
    if (!formData.methodology.trim()) {
      toast({
        title: t('error'),
        description: t('profilePage.methodologyRequired'),
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(t('profilePage.failedToSaveProfile'));
      }
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: t('profilePage.profileSaved'),
        description: t('profilePage.profileSavedDesc'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('profilePage.failedToSaveProfile'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">{t('profilePage.pleaseSignIn')}</h1>
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <a href="/api/login">{t('profilePage.signIn')}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={t('profilePage.profileImageAlt')} 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-200 shadow-lg"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex flex-col items-center justify-center border-2 border-dashed border-violet-300 cursor-pointer hover:border-violet-400 transition-colors">
                  <Camera className="h-6 w-6 text-violet-400 mb-1" />
                  <span className="text-[10px] text-violet-500 font-medium">{t('profilePage.addPhoto')}</span>
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
              <h1 className="text-2xl font-semibold text-slate-900" data-testid="text-profile-title">
                {formData.firstName ? `${formData.firstName} ${formData.lastName}` : t('profilePage.title')}
              </h1>
              <p className="text-slate-500 text-sm">{formData.email}</p>
              {!profileImage && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  {t('profilePage.photoAppearInChats')}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            data-testid="button-save-profile"
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin me-2" />
            ) : (
              <Save className="h-4 w-4 me-2" />
            )}
            {t('profilePage.save')}
          </Button>
        </div>

        <div className="space-y-8">
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">{t('profilePage.personalInfo')}</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs text-slate-500">
                    {t('profilePage.firstName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={t('profilePage.firstNamePlaceholder')}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs text-slate-500">
                    {t('profilePage.lastName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={t('profilePage.lastNamePlaceholder')}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-slate-500">{t('profilePage.email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('profilePage.emailPlaceholder')}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl ps-10"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">{t('profilePage.professionalDetails')}</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-xs text-slate-500">
                  {t('profilePage.specialty')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder={t('profilePage.specialtyPlaceholder')}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl"
                  data-testid="input-specialty"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="methodology" className="text-xs text-slate-500">
                  {t('profilePage.methodology')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="methodology"
                  value={formData.methodology}
                  onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                  placeholder={t('profilePage.methodologyPlaceholder')}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl"
                  data-testid="input-methodology"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="uniqueApproach" className="text-xs text-slate-500">{t('profilePage.uniqueApproach')}</Label>
                <Textarea
                  id="uniqueApproach"
                  value={formData.uniqueApproach}
                  onChange={(e) => setFormData({ ...formData, uniqueApproach: e.target.value })}
                  placeholder={t('profilePage.uniqueApproachPlaceholder')}
                  rows={2}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl resize-none"
                  data-testid="input-unique-approach"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs text-slate-500">{t('profilePage.aboutYou')}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={t('profilePage.aboutYouPlaceholder')}
                  rows={3}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl resize-none"
                  data-testid="input-bio"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs text-slate-500">{t('profilePage.website')}</Label>
                <div className="relative">
                  <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder={t('profilePage.websitePlaceholder')}
                    className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 rounded-xl ps-10"
                    data-testid="input-website"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">{t('profilePage.subscriptionBilling')}</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{t('profilePage.freePlan')}</p>
                    <p className="text-xs text-slate-400">{t('profilePage.currentlyActive')}</p>
                  </div>
                  <span className="ms-auto text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                    {t('profilePage.active')}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 leading-relaxed">
                  {t('profilePage.premiumPlansComingSoon')}
                </p>

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="text-sm text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
                      data-testid="button-cancel-subscription"
                    >
                      {t('profilePage.cancelAccount')}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border-slate-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-slate-900">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {t('profilePage.cancelAccountTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600">
                        {t('profilePage.cancelAccountDescription')}
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>{t('profilePage.allYourJourneys')}</li>
                          <li>{t('profilePage.participantDataProgress')}</li>
                          <li>{t('profilePage.yourProfileInfo')}</li>
                        </ul>
                        <p className="mt-3 font-medium text-slate-900">{t('profilePage.actionCannotBeUndone')}</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200">{t('profilePage.keepMyAccount')}</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => {
                          const subject = encodeURIComponent(t('profilePage.accountCancellationSubject'));
                          window.location.href = `mailto:support@flow83.com?subject=${subject}`;
                        }}
                      >
                        {t('profilePage.contactSupport')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
