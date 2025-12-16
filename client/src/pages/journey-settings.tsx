import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/landing/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, Loader2, Save, Pencil } from "lucide-react";
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
        description: "Failed to save journey settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Journey not found</h1>
          <Button onClick={() => setLocation("/journeys")} data-testid="button-go-journeys">
            Go to Journeys
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation(`/journey/${journey.id}/edit`)}
              className="gap-2"
              data-testid="button-back-to-editor"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Editor
            </Button>
          </div>

          <Card className="shadow-spiritual">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Journey Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold">Journey Name *</Label>
                <Input 
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g., "Healing the Heart"'
                  className="text-lg"
                  data-testid="input-journey-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="text-lg font-semibold">Main Goal *</Label>
                <Textarea 
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder='e.g., "To help people release emotional pain from past relationships and find inner peace."'
                  className="min-h-[100px]"
                  data-testid="textarea-journey-goal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience" className="text-lg font-semibold">Target Audience *</Label>
                <Input 
                  id="audience"
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  placeholder='e.g., "Women post-breakup", "Teens dealing with anxiety"'
                  data-testid="input-journey-audience"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-semibold">Duration *</Label>
                <RadioGroup 
                  value={formData.duration} 
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="duration-3" data-testid="radio-duration-3" />
                    <Label htmlFor="duration-3">3 days - Quick transformation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7" id="duration-7" data-testid="radio-duration-7" />
                    <Label htmlFor="duration-7">7 days - Deep journey</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-semibold">Description</Label>
                <p className="text-sm text-muted-foreground">Optional - Additional notes or vision for this journey</p>
                <Textarea 
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='e.g., "I want it to feel like entering a sacred temple"'
                  className="min-h-[80px]"
                  data-testid="textarea-journey-description"
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full bg-primary hover:bg-primary/90" 
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JourneySettingsPage;
