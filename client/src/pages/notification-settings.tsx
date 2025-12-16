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
import type { NotificationSettings } from "@shared/schema";

type NotifyOption = "email" | "none";

const NotificationSettingsPage = () => {
  const { toast } = useToast();
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
          title: "Error",
          description: "Failed to load notification settings",
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
        title: "Saved!",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
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
              <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
              <p className="text-sm text-white/50">Customize when you receive alerts</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"
            data-testid="button-save-notifications"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Participant Milestones</h2>
                <p className="text-sm text-white/50">Get notified when participants reach key milestones</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">New Participant Joined</Label>
                    <p className="text-xs text-white/40">When someone starts your flow</p>
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
                    <Label className="text-white font-medium">Day Completed</Label>
                    <p className="text-xs text-white/40">When a participant completes a day</p>
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
                    <Label className="text-white font-medium">Flow Completed</Label>
                    <p className="text-xs text-white/40">When a participant finishes the entire flow</p>
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
                <h2 className="text-lg font-semibold text-white">Inactivity Alerts</h2>
                <p className="text-sm text-white/50">Get notified when participants need attention</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <Label className="text-white font-medium">Inactive Participant Alert</Label>
                    <p className="text-xs text-white/40">When someone hasn't engaged for a while</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.notifyOnInactivity === "email"}
                  onCheckedChange={(checked) => updateSetting("notifyOnInactivity", checked ? "email" : "none")}
                  data-testid="switch-notify-inactivity"
                />
              </div>

              {settings.notifyOnInactivity === "email" && (
                <div className="py-3 pl-11">
                  <Label className="text-white/80 text-sm mb-4 block">
                    Alert me after <span className="font-bold text-violet-400">{settings.inactivityThresholdDays} days</span> of inactivity
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
                    <span>1 day</span>
                    <span>7 days</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-white/30">
              All notifications will be sent to your registered email address.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
