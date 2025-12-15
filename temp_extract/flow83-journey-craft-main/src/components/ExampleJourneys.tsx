import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Target } from "lucide-react";

interface JourneyExample {
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  highlights: string[];
  targetAudience: string;
}

const journeyExamples: JourneyExample[] = [
  {
    title: "Anxiety Management Journey",
    category: "Mental Health",
    level: "Beginner",
    duration: "14 days",
    description: "A comprehensive program combining mindfulness, breathing techniques, and cognitive reframing to help manage anxiety symptoms effectively.",
    highlights: ["Daily guided meditations", "Breathing exercises", "Thought pattern recognition", "Stress response techniques"],
    targetAudience: "Individuals experiencing mild to moderate anxiety"
  },
  {
    title: "Mindfulness for Beginners", 
    category: "Wellness",
    level: "Beginner",
    duration: "21 days",
    description: "Start your mindfulness practice with gentle guidance through meditation basics, body awareness, and simple daily exercises.",
    highlights: ["Progressive meditation lengths", "Body scan practices", "Mindful eating exercises", "Integration techniques"],
    targetAudience: "Complete beginners to meditation and mindfulness"
  },
  {
    title: "Grief Support Process",
    category: "Therapy", 
    level: "Intermediate",
    duration: "30 days",
    description: "A gentle journey through the stages of grief with supportive exercises, reflection prompts, and healing activities designed by grief counselors.",
    highlights: ["Emotional processing tools", "Memory honoring rituals", "Support network building", "Self-compassion practices"],
    targetAudience: "Those processing loss or significant life transitions"
  }
];

const ExampleJourneys = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Example Transformative Journeys
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            Explore sample journeys created by expert therapists, coaches, and wellness professionals 
            to understand the power and flexibility of our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {journeyExamples.map((journey, index) => (
            <Card key={index} className="gradient-card shadow-card hover:shadow-spiritual transition-all duration-300 border-0 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-sm">
                    {journey.category}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {journey.level}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-foreground mb-2">
                  {journey.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{journey.duration}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {journey.description}
                </CardDescription>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      What's Included:
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {journey.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Target Audience:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {journey.targetAudience}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleJourneys;