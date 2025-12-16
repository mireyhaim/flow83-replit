import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  journeyName: z.string().min(1, "Flow name is required"),
  mainGoal: z.string().min(10, "Please provide a detailed goal (minimum 10 characters)"),
  targetAudience: z.string().min(1, "Target audience is required"),
  duration: z.enum(["3", "7"], { required_error: "Please select a duration" }),
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
      journeyName: initialData?.journeyName || "",
      mainGoal: initialData?.mainGoal || "",
      targetAudience: initialData?.targetAudience || "",
      duration: initialData?.duration?.[0]?.toString() || "7",
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
        {/* Journey Name */}
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
              <FormLabel className="text-lg font-semibold text-white">What is the main goal or intention of this flow? *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "To help people release emotional pain from past relationships and find inner peace."'
                  className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
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
              <FormLabel className="text-lg font-semibold text-white">How many days do you envision? *</FormLabel>
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


        {/* Desired Feeling */}
        <FormField
          control={form.control}
          name="desiredFeeling"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold text-white">How would you like your users to feel by the end of the flow?</FormLabel>
              <FormDescription className="text-white/50">Optional - helps us understand the emotional transformation</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "Clear, safe, grounded, empowered"'
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
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
              <FormLabel className="text-lg font-semibold text-white">Anything else you'd like to share or channel into this flow?</FormLabel>
              <FormDescription className="text-white/50">Optional - share your vision, energy, or special intentions</FormDescription>
              <FormControl>
                <Textarea 
                  placeholder='e.g., "I want it to feel like entering a sacred temple"'
                  className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90" size="lg">
          Continue to Content Upload
        </Button>
      </form>
    </Form>
  );
};

export default JourneyIntentForm;
