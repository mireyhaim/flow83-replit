import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export default function MethodPage() {
  const { method, updateMethod } = useStore();
  const { toast } = useToast();
  
  const { register, control, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: method || {
      name: "",
      purpose: "",
      stages: [{ id: uuidv4(), name: "", description: "" }],
      toneGuidelines: "",
      boundaries: "",
      targetAudience: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stages"
  });

  const onSubmit = (data: any) => {
    updateMethod(data);
    toast({
      title: "Method Updated",
      description: "Your changes have been saved to the OS.",
    });
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Method Layer</h1>
            <p className="text-muted-foreground">Define the DNA of your transformation.</p>
          </div>
          <Button type="submit" disabled={!isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </header>

        <div className="space-y-8 pb-20">
          {/* Core Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Core Identity</CardTitle>
              <CardDescription>What is this method called and why does it exist?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Method Name</Label>
                <Input id="name" {...register("name")} placeholder="e.g. The Clarity Protocol" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" {...register("purpose")} placeholder="What transformation does this create?" className="h-24" />
              </div>
            </CardContent>
          </Card>

          {/* Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Method Stages</CardTitle>
              <CardDescription>The structural arc of the change.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2">
                  <div className="flex-1 space-y-2">
                    <Label>Stage {index + 1}</Label>
                    <Input {...register(`stages.${index}.name`)} placeholder="Stage Name" />
                    <Textarea {...register(`stages.${index}.description`)} placeholder="Description" className="h-20" />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="mt-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => append({ id: uuidv4(), name: "", description: "" })}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Stage
              </Button>
            </CardContent>
          </Card>

          {/* AI Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>AI Guidelines</CardTitle>
              <CardDescription>Instruct the Journey Engine on how to speak and behave.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Textarea id="tone" {...register("toneGuidelines")} placeholder="e.g. Empathetic, strict, playful, academic..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="boundaries">Boundaries</Label>
                <Textarea id="boundaries" {...register("boundaries")} placeholder="What should the AI NEVER do?" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input id="audience" {...register("targetAudience")} placeholder="Who is this for?" />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  );
}
