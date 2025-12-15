import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Heart, Clock } from "lucide-react";

const featuredFlows = [
  {
    id: 1,
    title: "7-Day Anxiety Reset",
    description: "A comprehensive journey to manage anxiety through mindfulness and breathing techniques",
    creator: "Dr. Sarah Chen",
    category: "Mental Health",
    participants: 1250,
    likes: 342,
    duration: "7 days",
    thumbnail: "/src/assets/digital-mindfulness.jpg",
    difficulty: "Beginner"
  },
  {
    id: 2,
    title: "Career Pivot Masterclass",
    description: "Step-by-step guide to successfully transition to your dream career",
    creator: "Marcus Rodriguez",
    category: "Career Growth",
    participants: 890,
    likes: 267,
    duration: "14 days", 
    thumbnail: "/src/assets/future-healing.jpg",
    difficulty: "Intermediate"
  },
  {
    id: 3,
    title: "Grief Healing Journey",
    description: "A compassionate path through loss with therapeutic techniques and community support",
    creator: "Dr. Ahmed Hassan",
    category: "Emotional Healing",
    participants: 456,
    likes: 198,
    duration: "21 days",
    thumbnail: "/src/assets/digital-therapy-science.jpg",
    difficulty: "All Levels"
  },
  {
    id: 4,
    title: "Leadership Presence Blueprint",
    description: "Develop authentic leadership skills and executive presence",
    creator: "Lisa Park",
    category: "Leadership",
    participants: 632,
    likes: 151,
    duration: "10 days",
    thumbnail: "/src/assets/digital-resilience.jpg",
    difficulty: "Advanced"
  }
];

const CommunityFlowsShowcase = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Examples of Community-Created Flows
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover transformative journeys created by our expert community members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featuredFlows.map((flow) => (
          <Card key={flow.id} className="gradient-card border-0 shadow-card hover:shadow-spiritual transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={flow.thumbnail} 
                    alt={flow.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg">{flow.title}</CardTitle>
                    <CardDescription>by {flow.creator}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{flow.category}</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground mb-4">{flow.description}</p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {flow.participants}
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {flow.likes}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {flow.duration}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {flow.difficulty}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <Button variant="spiritual" size="lg">
          Explore All Community Flows
        </Button>
      </div>
    </section>
  );
};

export default CommunityFlowsShowcase;