import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  journeyName: z.string().min(1, "Journey name is required"),
  mainGoal: z.string().min(10, "Please provide a detailed goal (minimum 10 characters)"),
  targetAudience: z.string().min(1, "Target audience is required"),
  duration: z.array(z.number()).length(1),
  hasContent: z.string(),
  desiredFeeling: z.string().optional(),
  elements: z.array(z.string()).optional(),
  additionalNotes: z.string().optional(),
});

interface JourneyIntentFormProps {
  onComplete: (data: any) => void;
}

const JourneyIntentForm = ({ onComplete }: JourneyIntentFormProps) => {
  const [duration, setDuration] = useState([7]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      journeyName: "",
      mainGoal: "",
      targetAudience: "",
      duration: [7],
      hasContent: "",
      desiredFeeling: "",
      elements: [],
      additionalNotes: "",
    },
  });

  const handleElementChange = (element: string, checked: boolean) => {
    if (checked) {
      setSelectedElements([...selectedElements, element]);
    } else {
      setSelectedElements(selectedElements.filter(e => e !== element));
    }
    form.setValue('elements', checked ? [...selectedElements, element] : selectedElements.filter(e => e !== element));
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onComplete({ ...data, elements: selectedElements });
  };

  const elements = [
    "Guided Meditations",
    "Video Content", 
    "Deep Reflection Questions",
    "Sacred Rituals",
    "Journaling Prompts",
    "Breathing Exercises",
    "Affirmations",
    "Energy Work"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Journey Name */}
        <FormField
          control={form.control}
          name="journeyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">What's the name of your journey? *</FormLabel>
              <FormControl>
                <Input 
                  placeholder='e.g., "Healing the Heart"' 
                  className="text-lg"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Main Goal */}
        <FormField
          control={form.control}
          name="mainGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">What is the main goal or intention of this journey? *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "To help people release emotional pain from past relationships and find inner peace."'
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Audience */}
        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Who is this journey for? *</FormLabel>
              <FormControl>
                <Input 
                  placeholder='e.g., "Women post-breakup", "Teens dealing with anxiety"'
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">How many days do you envision? *</FormLabel>
              <FormControl>
                <div className="px-3">
                  <Slider
                    min={3}
                    max={30}
                    step={1}
                    value={duration}
                    onValueChange={(value) => {
                      setDuration(value);
                      field.onChange(value);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>3 days</span>
                    <span className="font-semibold text-primary">{duration[0]} days</span>
                    <span>30 days</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Has Content */}
        <FormField
          control={form.control}
          name="hasContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Do you already have content prepared? *</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes">Yes, I have content ready</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no">No, I need help creating it</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partially" id="partially" />
                    <Label htmlFor="partially">Partially, I have some content</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Desired Feeling */}
        <FormField
          control={form.control}
          name="desiredFeeling"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">How would you like your users to feel by the end of the journey?</FormLabel>
              <FormDescription>Optional - helps us understand the emotional transformation</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "Clear, safe, grounded, empowered"'
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Elements */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold">What elements would you like to include?</Label>
          <p className="text-sm text-muted-foreground">Optional - select all that resonate with your vision</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {elements.map((element) => (
              <div key={element} className="flex items-center space-x-2">
                <Checkbox 
                  id={element}
                  checked={selectedElements.includes(element)}
                  onCheckedChange={(checked) => handleElementChange(element, checked as boolean)}
                />
                <Label htmlFor={element} className="text-sm font-normal">{element}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Anything else you'd like to share or channel into this journey?</FormLabel>
              <FormDescription>Optional - share your vision, energy, or special intentions</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "I want it to feel like entering a sacred temple"'
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-spiritual" size="lg">
          Continue to Content Upload
        </Button>
      </form>
    </Form>
  );
};

export default JourneyIntentForm;
