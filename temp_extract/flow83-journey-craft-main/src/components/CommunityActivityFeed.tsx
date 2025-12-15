import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Heart, MessageCircle, Star, Users, Zap } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "achievement",
    user: "Dr. Sarah Chen",
    userInitials: "SC",
    action: "reached 1000 participants milestone",
    target: "Anxiety Reset Flow",
    time: "2 hours ago",
    icon: Award,
    iconColor: "text-yellow-500"
  },
  {
    id: 2,
    type: "new_flow",
    user: "Emma Thompson",
    userInitials: "ET",
    action: "published a new flow",
    target: "Morning Meditation Ritual",
    time: "4 hours ago",
    icon: Zap,
    iconColor: "text-purple-500"
  },
  {
    id: 3,
    type: "review",
    user: "Marcus Rodriguez",
    userInitials: "MR",
    action: "received a 5-star review",
    target: "Career Pivot Masterclass",
    time: "6 hours ago",
    icon: Star,
    iconColor: "text-yellow-500"
  },
  {
    id: 4,
    type: "community",
    user: "Lisa Park",
    userInitials: "LP", 
    action: "started a discussion",
    target: "Best Practices for Leadership Flows",
    time: "8 hours ago",
    icon: MessageCircle,
    iconColor: "text-blue-500"
  },
  {
    id: 5,
    type: "milestone",
    user: "Dr. James Mitchell",
    userInitials: "JM",
    action: "celebrated 100 flow completions",
    target: "Trauma Recovery Journey", 
    time: "1 day ago",
    icon: Users,
    iconColor: "text-green-500"
  },
  {
    id: 6,
    type: "feature",
    user: "Dr. Ahmed Hassan",
    userInitials: "AH",
    action: "was featured as creator of the week",
    target: "",
    time: "2 days ago",
    icon: Heart,
    iconColor: "text-red-500"
  }
];

const CommunityActivityFeed = () => {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Community Activity
        </h2>
        <p className="text-xl text-muted-foreground">
          See what's happening in our creator community
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y">
            {activities.map((activity) => {
              const IconComponent = activity.icon;
              return (
                <div key={activity.id} className="p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm font-medium">
                        {activity.userInitials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-foreground">{activity.user}</span>
                            <span className="text-muted-foreground"> {activity.action}</span>
                            {activity.target && (
                              <span className="font-medium text-foreground"> "{activity.target}"</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.time}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-4 h-4 ${activity.iconColor}`} />
                          {activity.type === 'achievement' && (
                            <Badge variant="secondary" className="text-xs">
                              Milestone
                            </Badge>
                          )}
                          {activity.type === 'new_flow' && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                          {activity.type === 'feature' && (
                            <Badge variant="default" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Want to see more activity? Join our community and stay updated!
        </p>
      </div>
    </section>
  );
};

export default CommunityActivityFeed;