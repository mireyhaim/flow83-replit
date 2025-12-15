import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, Heart, Calendar } from "lucide-react";

const successStories = [
  {
    id: 1,
    user: "Jennifer L.",
    userInitials: "JL",
    story: "The 7-Day Anxiety Reset completely transformed my daily life. I went from constant worry to feeling calm and centered. Dr. Chen's approach was exactly what I needed.",
    flow: "7-Day Anxiety Reset",
    creator: "Dr. Sarah Chen",
    outcome: "Reduced anxiety by 80%",
    timeframe: "Completed 3 weeks ago",
    category: "Mental Health"
  },
  {
    id: 2,
    user: "Michael R.",
    userInitials: "MR",
    story: "Marcus's career pivot program gave me the courage and roadmap to leave corporate law and start my own consulting firm. Best decision I ever made!",
    flow: "Career Pivot Masterclass", 
    creator: "Marcus Rodriguez",
    outcome: "Successfully changed careers",
    timeframe: "Completed 2 months ago",
    category: "Career Growth"
  },
  {
    id: 3,
    user: "Sarah K.",
    userInitials: "SK",
    story: "After losing my mother, I didn't think I'd ever feel whole again. Dr. Hassan's grief journey helped me process my emotions and find peace.",
    flow: "Grief Healing Journey",
    creator: "Dr. Ahmed Hassan", 
    outcome: "Found emotional balance",
    timeframe: "Completed 1 month ago",
    category: "Emotional Healing"
  },
  {
    id: 4,
    user: "David T.",
    userInitials: "DT",
    story: "Lisa's leadership program transformed not just how I lead my team, but how I show up in all areas of my life. My confidence has skyrocketed.",
    flow: "Leadership Presence Blueprint",
    creator: "Lisa Park",
    outcome: "Promoted to VP level",
    timeframe: "Completed 6 weeks ago", 
    category: "Leadership"
  }
];

const CommunitySuccessStories = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 bg-muted/20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Success Stories
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real transformations from community members who completed flows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {successStories.map((story) => (
          <Card key={story.id} className="border shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="font-medium">
                      {story.userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{story.user}</CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {story.timeframe}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {story.category}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                <Quote className="w-8 h-8 text-muted-foreground/20 absolute -top-2 -left-2" />
                <p className="text-muted-foreground italic mb-6 pl-6">
                  "{story.story}"
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flow completed:</span>
                  <span className="font-medium text-foreground">{story.flow}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-medium text-foreground">{story.creator}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Outcome:</span>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 text-red-500 mr-1" />
                    <span className="font-medium text-foreground">{story.outcome}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-6">
          Ready to create your own success story?
        </p>
        <div className="space-x-4">
          <Badge variant="outline" className="px-4 py-2">
            ✨ Join 250,000+ transformed lives
          </Badge>
        </div>
      </div>
    </section>
  );
};

export default CommunitySuccessStories;