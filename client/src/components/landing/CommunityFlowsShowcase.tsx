import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import digitalMindfulness from "@/assets/digital-mindfulness.jpg";
import futureHealing from "@/assets/future-healing.jpg";
import digitalTherapyScience from "@/assets/digital-therapy-science.jpg";
import digitalResilience from "@/assets/digital-resilience.jpg";

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
    thumbnail: digitalMindfulness,
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
    thumbnail: futureHealing,
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
    duration: "7 days",
    thumbnail: digitalTherapyScience,
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
    thumbnail: digitalResilience,
    difficulty: "Advanced"
  }
];

const CommunityFlowsShowcase = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
          <span className="text-gray-900">Examples of </span>
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
            Community-Created Flows
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Discover transformative journeys created by our expert community members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featuredFlows.map((flow) => (
          <Link href={`/flow-demo/${flow.id}`} key={flow.id} data-testid={`link-flow-${flow.id}`}>
            <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-violet-200 transition-all duration-300 cursor-pointer h-full">
              <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={flow.thumbnail} 
                    alt={flow.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <CardTitle className="text-lg text-gray-900">{flow.title}</CardTitle>
                    <CardDescription className="text-gray-500">by {flow.creator}</CardDescription>
                  </div>
                </div>
                <Badge className="bg-violet-100 text-violet-700">{flow.category}</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-600 mb-4">{flow.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
                <Badge variant="outline" className="text-xs border-violet-200 text-violet-600">
                  {flow.difficulty}
                </Badge>
              </div>
            </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CommunityFlowsShowcase;
