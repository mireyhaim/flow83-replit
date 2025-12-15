import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStore, Journey } from "@/lib/store";
import { useRoute, useLocation } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, RefreshCcw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JourneyEditorPage() {
  const [, params] = useRoute("/journey/:id/edit");
  const [, setLocation] = useLocation();
  const { getJourney, updateJourneyDay, publishJourney } = useStore();
  const { toast } = useToast();
  
  const journey = getJourney(params?.id || "");

  if (!journey) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Journey not found</h2>
          <Button variant="link" onClick={() => setLocation("/journeys")}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveDay = (dayNum: number, field: string, value: string) => {
    updateJourneyDay(journey.id, dayNum, { [field]: value });
  };

  const handlePublish = () => {
    publishJourney(journey.id);
    toast({
      title: "Journey Published",
      description: "It is now live and purchasable.",
    });
    setLocation("/journeys");
  };

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-background/95 backdrop-blur z-20 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{journey.name}</h1>
              <Badge variant={journey.status === "published" ? "default" : "secondary"}>
                {journey.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">7-Day Fixed Linear Flow</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Regenerating...", description: "This would regenerate the content with AI." })}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Regenerate
          </Button>
          <Button onClick={handlePublish}>
            Publish Journey
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto pb-20">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {journey.days.map((day) => (
            <AccordionItem key={day.dayNumber} value={`day-${day.dayNumber}`} className="border rounded-lg bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-left">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-sm font-bold">
                    {day.dayNumber}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{day.title}</div>
                    <div className="text-xs text-muted-foreground font-normal truncate max-w-[300px]">
                      {day.coreMessage}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div className="grid gap-2">
                  <Label>Day Title</Label>
                  <Input 
                    defaultValue={day.title} 
                    onBlur={(e) => handleSaveDay(day.dayNumber, 'title', e.target.value)} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Core Message</Label>
                  <Textarea 
                    defaultValue={day.coreMessage} 
                    className="h-24"
                    onBlur={(e) => handleSaveDay(day.dayNumber, 'coreMessage', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Daily Task</Label>
                  <Textarea 
                    defaultValue={day.task}
                    className="bg-secondary/20"
                    onBlur={(e) => handleSaveDay(day.dayNumber, 'task', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Reflection Prompt</Label>
                    <Textarea 
                      defaultValue={day.reflectionPrompt}
                      onBlur={(e) => handleSaveDay(day.dayNumber, 'reflectionPrompt', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-primary">AI Chat Context (Hidden)</Label>
                    <Textarea 
                      defaultValue={day.chatContext}
                      className="font-mono text-xs"
                      onBlur={(e) => handleSaveDay(day.dayNumber, 'chatContext', e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </DashboardLayout>
  );
}
