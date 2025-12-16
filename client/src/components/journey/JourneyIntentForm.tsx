import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const professionOptions = [
  { value: "therapist", label: "Therapist" },
  { value: "coach", label: "Coach" },
  { value: "healer", label: "Healer" },
  { value: "mentor", label: "Mentor" },
  { value: "counselor", label: "Counselor" },
  { value: "yoga_teacher", label: "Yoga Teacher" },
  { value: "meditation_guide", label: "Meditation Guide" },
  { value: "other", label: "Other" },
];

const toneOptions = [
  { value: "warm", label: "Warm & Personal" },
  { value: "professional", label: "Professional" },
  { value: "direct", label: "Direct & Clear" },
  { value: "gentle", label: "Gentle & Soft" },
  { value: "motivating", label: "Motivating & Energetic" },
  { value: "spiritual", label: "Spiritual & Deep" },
];

const painPointOptions = [
  { value: "anxiety", label: "Anxiety & Stress" },
  { value: "relationships", label: "Relationship Issues" },
  { value: "self_esteem", label: "Low Self-Esteem" },
  { value: "grief", label: "Grief & Loss" },
  { value: "burnout", label: "Burnout & Exhaustion" },
  { value: "life_transitions", label: "Life Transitions" },
  { value: "trauma", label: "Past Trauma" },
  { value: "purpose", label: "Lack of Purpose / Direction" },
  { value: "health", label: "Health Challenges" },
  { value: "creativity", label: "Creative Blocks" },
];

const formSchema = z.object({
  profession: z.string().min(1, "Please select your profession"),
  journeyName: z.string().min(1, "Flow name is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  painPoints: z.array(z.string()).optional(),
  painPointsOther: z.string().optional(),
  mainGoal: z.string().min(10, "Please provide a detailed goal (minimum 10 characters)"),
  duration: z.enum(["3", "7"], { required_error: "Please select a duration" }),
  tone: z.string().min(1, "Please select a tone"),
  desiredFeeling: z.string().optional(),
  additionalNotes: z.string().optional(),
});

interface JourneyIntentFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const JourneyIntentForm = ({ onComplete, initialData }: JourneyIntentFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profession: initialData?.profession || "",
      journeyName: initialData?.journeyName || "",
      targetAudience: initialData?.targetAudience || "",
      painPoints: initialData?.painPoints || [],
      painPointsOther: initialData?.painPointsOther || "",
      mainGoal: initialData?.mainGoal || "",
      duration: initialData?.duration?.[0]?.toString() || "7",
      tone: initialData?.tone || "",
      desiredFeeling: initialData?.desiredFeeling || "",
      additionalNotes: initialData?.additionalNotes || "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onComplete({ ...data, duration: [parseInt(data.duration)] });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profession */}
        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">What is your profession? *</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3">
                  {professionOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`profession-${option.value}`} 
                        data-testid={`radio-profession-${option.value}`}
                        className="border-white/30 text-violet-500" 
                      />
                      <Label htmlFor={`profession-${option.value}`} className="text-white/80 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Flow Name */}
        <FormField
          control={form.control}
          name="journeyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">What's the name of your flow? *</FormLabel>
              <FormControl>
                <Input 
                  placeholder='e.g., "Healing the Heart"' 
                  className="text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-journey-name"
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
              <FormLabel className="text-lg font-semibold text-white">Who is this flow for? *</FormLabel>
              <FormControl>
                <Input 
                  placeholder='e.g., "Women post-breakup", "Teens dealing with anxiety"'
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-target-audience"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pain Points */}
        <FormField
          control={form.control}
          name="painPoints"
          render={() => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">What challenges do your clients face?</FormLabel>
              <FormDescription className="text-white/50">Select all that apply</FormDescription>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {painPointOptions.map((option) => (
                  <FormField
                    key={option.value}
                    control={form.control}
                    name="painPoints"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, option.value]);
                              } else {
                                field.onChange(currentValue.filter((v: string) => v !== option.value));
                              }
                            }}
                            className="border-white/30 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                            data-testid={`checkbox-pain-${option.value}`}
                          />
                        </FormControl>
                        <Label className="text-white/80 cursor-pointer text-sm font-normal">
                          {option.label}
                        </Label>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pain Points Other */}
        <FormField
          control={form.control}
          name="painPointsOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-white/70">Other challenges (optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder='e.g., "Postpartum challenges", "Career change"'
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-pain-other"
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
              <FormLabel className="text-lg font-semibold text-white">What is the main goal of this flow? *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "To help people release emotional pain from past relationships and find inner peace."'
                  className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="textarea-main-goal"
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
              <FormLabel className="text-lg font-semibold text-white">How many days? *</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="duration-3" data-testid="radio-duration-3" className="border-white/30 text-violet-500" />
                    <Label htmlFor="duration-3" className="text-white/80">3 days - Quick transformation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7" id="duration-7" data-testid="radio-duration-7" className="border-white/30 text-violet-500" />
                    <Label htmlFor="duration-7" className="text-white/80">7 days - Deep flow</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tone */}
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">What tone fits your clients? *</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`tone-${option.value}`} 
                        data-testid={`radio-tone-${option.value}`}
                        className="border-white/30 text-violet-500" 
                      />
                      <Label htmlFor={`tone-${option.value}`} className="text-white/80 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
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
              <FormLabel className="text-lg font-semibold text-white">How should users feel at the end?</FormLabel>
              <FormDescription className="text-white/50">Optional - helps us understand the emotional transformation</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "Clear, safe, grounded, empowered"'
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="textarea-desired-feeling"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">Anything else to share?</FormLabel>
              <FormDescription className="text-white/50">Optional - share your vision, energy, or special intentions</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "I want it to feel like entering a sacred temple"'
                  className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="textarea-additional-notes"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90" size="lg" data-testid="button-continue">
          Continue to Content Upload
        </Button>
      </form>
    </Form>
  );
};

export default JourneyIntentForm;
