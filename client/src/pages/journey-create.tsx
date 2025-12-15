import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Loader2, Sparkles, Upload } from "lucide-react";

export default function JourneyCreatePage() {
  const { createJourney } = useStore();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsGenerating(true);
    // Simulate generation
    const newId = await createJourney(data);
    setIsGenerating(false);
    setLocation(`/journey/${newId}/edit`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/5 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Generate Journey</h1>
          <p className="text-muted-foreground">Turn your method into a 7-day experience.</p>
        </header>

        {isGenerating ? (
          <Card className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
            <CardContent>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Crafting the experience...</h2>
              <p className="text-muted-foreground">
                Analyzing your method, chunking content, and structuring 7 days of flow.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Context</CardTitle>
                <CardDescription>Help the AI tailor the journey for this specific product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>What is the specific goal of this journey?</Label>
                  <Input {...register("transformationGoal")} placeholder="e.g. To help people write their first chapter" required />
                </div>
                <div className="grid gap-2">
                  <Label>Who is the ideal participant?</Label>
                  <Input {...register("participant")} placeholder="e.g. Aspiring novelists with writer's block" required />
                </div>
                <div className="grid gap-2">
                  <Label>Specific Tone Adjustments</Label>
                  <Textarea {...register("tone")} placeholder="Any specific vibes for this run?" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Material</CardTitle>
                <CardDescription>Upload PDF or TXT files to ground the AI in your specific content.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, TXT up to 10MB</p>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full">
              Generate Journey
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
