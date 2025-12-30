import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, Loader2, Save, 
  Users, Trophy, AlertTriangle, Calendar, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTranslation } from "react-i18next";
import type { NotificationSettings } from "@shared/schema";

type NotifyOption = "email" | "none";

const NotificationSettingsPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    notifyOnJoin: "email" as NotifyOption,
    notifyOnDayComplete: "none" as NotifyOption,
    notifyOnFlowComplete: "email" as NotifyOption,
    notifyOnInactivity: "email" as NotifyOption,
    inactivityThresholdDays: 2,
    dailySummary: "none" as NotifyOption,
    weeklySummary: "email" as NotifyOption,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiRequest("GET", "/api/notification-settings");
        const data = await res.json();
        setSettings({
          notifyOnJoin: data.notifyOnJoin || "email",
          notifyOnDayComplete: data.notifyOnDayComplete || "none",
          notifyOnFlowComplete: data.notifyOnFlowComplete || "email",
          notifyOnInactivity: data.notifyOnInactivity || "email",
          inactivityThresholdDays: data.inactivityThresholdDays || 2,
          dailySummary: data.dailySummary || "none",
          weeklySummary: data.weeklySummary || "email",
        });
      } catch (error) {
        toast({
          title: t('error'),
          description: t('notificationSettings.failedToLoad'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("PUT", "/api/notification-settings", settings);
      toast({
        title: t('notificationSettings.saved'),
        description: t('notificationSettings.savedDescription'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('notificationSettings.failedToSave'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('notificationSettings.title')}</h1>
              <p className="text-sm text-white/50">{t('notificationSettings.subtitle')}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700"
            data-testid="button-save-notifications"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin me-2" />
            ) : (
              <Save className="w-4 h-4 me-2" />
            )}
            {t('notificationSettings.saveChanges')}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('notificationSettings.participantMilestones')}</h2>
                <p className="text-sm text-white/50">{t('notificationSettings.participantMilestonesDesc')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">{t('notificationSettings.newParticipantJoined')}</Label>
                    <p className="text-xs text-white/40">{t('notificationSettings.newParticipantJoinedDesc')}</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifyOnJoin === "email"}
                  onCheckedChange={(checked) => updateSetting("notifyOnJoin", checked ? "email" : "none")}
                  data-testid="switch-notify-join"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">{t('notificationSettings.dayCompleted')}</Label>
                    <p className="text-xs text-white/40">{t('notificationSettings.dayCompletedDesc')}</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifyOnDayComplete === "email"}
                  onCheckedChange={(checked) => updateSetting("notifyOnDayComplete", checked ? "email" : "none")}
                  data-testid="switch-notify-day-complete"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">{t('notificationSettings.flowCompleted')}</Label>
                    <p className="text-xs text-white/40">{t('notificationSettings.flowCompletedDesc')}</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifyOnFlowComplete === "email"}
                  onCheckedChange={(checked) => updateSetting("notifyOnFlowComplete", checked ? "email" : "none")}
                  data-testid="switch-notify-flow-complete"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('notificationSettings.inactivityAlerts')}</h2>
                <p className="text-sm text-white/50">{t('notificationSettings.inactivityAlertsDesc')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">{t('notificationSettings.inactiveParticipantAlert')}</Label>
                    <p className="text-xs text-white/40">{t('notificationSettings.inactiveParticipantAlertDesc')}</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifyOnInactivity === "email"}
                  onCheckedChange={(checked) => updateSetting("notifyOnInactivity", checked ? "email" : "none")}
                  data-testid="switch-notify-inactivity"
                />
              </div>

              {settings.notifyOnInactivity === "email" && (
                <div className="py-3 ps-11">
                  <Label className="text-white/80 text-sm mb-4 block">
                    {t('notificationSettings.alertMeAfter')} <span className="font-bold text-violet-400">{settings.inactivityThresholdDays} {settings.inactivityThresholdDays === 1 ? t('notificationSettings.day') : t('notificationSettings.days')}</span> {t('notificationSettings.daysOfInactivity')}
                  </Label>
                  <Slider
                    value={[settings.inactivityThresholdDays]}
                    onValueChange={(value) => updateSetting("inactivityThresholdDays", value[0])}
                    min={1}
                    max={7}
                    step={1}
                    className="w-full max-w-xs"
                    data-testid="slider-inactivity-days"
                  />
                  <div className="flex justify-between text-xs text-white/30 mt-2 max-w-xs">
                    <span>1 {t('notificationSettings.day')}</span>
                    <span>7 {t('notificationSettings.days')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-white/30">
              {t('notificationSettings.allNotificationsSentTo')}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
