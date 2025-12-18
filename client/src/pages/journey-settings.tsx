import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Loader2, Save, Pencil, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi } from "@/lib/api";
import type { Journey } from "@shared/schema";

const JourneySettingsPage = () => {
  const [match, params] = useRoute("/journey/:id/settings");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    audience: "",
    duration: "7",
    description: "",
  });

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) return;
      try {
        const data = await journeyApi.getById(params.id);
        setJourney(data);
        setFormData({
          name: data.name || "",
          goal: data.goal || "",
          audience: data.audience || "",
          duration: data.duration?.toString() || "7",
          description: data.description || "",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load journey",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadJourney();
  }, [params?.id]);

  const handleSave = async () => {
    if (!journey) return;
    setIsSaving(true);
    try {
      await journeyApi.update(journey.id, {
        name: formData.name,
        goal: formData.goal,
        audience: formData.audience,
        duration: parseInt(formData.duration),
        description: formData.description,
      });
      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save flow settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Flow not found</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-go-journeys">
            Go to Flows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <header className="bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/journeys" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors" data-testid="link-my-flows">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">My Flows</span>
              </Link>
              <div className="h-5 w-px bg-white/10" />
              <h1 className="text-lg font-semibold text-white">Flow Settings</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation(`/journey/${journey.id}/edit`)}
              className="text-white/60 hover:text-white hover:bg-white/10"
              data-testid="button-back-to-editor"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Editor
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-[#1a1a2e]/60 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Pencil className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-semibold text-white">Edit Flow Details</h2>
          </div>
          <div className="space-y-6">
              <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white">Flow Name *</Label>
              <Input 
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., "Healing the Heart"'
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-journey-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-medium text-white">Main Goal *</Label>
              <Textarea 
                id="goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder='e.g., "To help people release emotional pain from past relationships and find inner peace."'
                className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="textarea-journey-goal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience" className="text-sm font-medium text-white">Target Audience *</Label>
              <Input 
                id="audience"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                placeholder='e.g., "Women post-breakup", "Teens dealing with anxiety"'
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="input-journey-audience"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Duration *</Label>
              <RadioGroup 
                value={formData.duration} 
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="duration-3" data-testid="radio-duration-3" className="border-white/30 text-violet-500" />
                  <Label htmlFor="duration-3" className="text-white/80">3 days - Quick transformation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="duration-7" data-testid="radio-duration-7" className="border-white/30 text-violet-500" />
                  <Label htmlFor="duration-7" className="text-white/80">7 days - Deep flow</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-white">Description</Label>
              <p className="text-xs text-white/40">Optional - Additional notes or vision for this flow</p>
              <Textarea 
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='e.g., "I want it to feel like entering a sacred temple"'
                className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-testid="textarea-journey-description"
              />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-violet-600 hover:bg-violet-700" 
              size="lg"
              disabled={isSaving || !formData.name || !formData.goal || !formData.audience}
              data-testid="button-save-settings"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save & Return to Editor
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JourneySettingsPage;
