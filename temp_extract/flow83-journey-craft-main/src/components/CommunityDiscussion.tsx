import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, ThumbsUp, Clock, Pin } from "lucide-react";

const discussions = [
  {
    id: 1,
    title: "Best practices for creating engaging flow content?",
    author: "Lisa Park",
    authorInitials: "LP",
    category: "Flow Creation", 
    replies: 23,
    likes: 45,
    lastActivity: "2 hours ago",
    isPinned: true,
    preview: "I've been experimenting with different content formats and would love to hear what's working for other creators..."
  },
  {
    id: 2,
    title: "How to handle difficult emotions during therapeutic flows",
    author: "Dr. Sarah Chen",
    authorInitials: "SC",
    category: "Mental Health",
    replies: 18,
    likes: 32,
    lastActivity: "4 hours ago", 
    isPinned: false,
    preview: "Sometimes participants experience unexpected emotional responses. Here's what I've learned about providing proper support..."
  },
  {
    id: 3,
    title: "Weekly Challenge: 5-Minute Morning Routine Flows",
    author: "Emma Thompson",
    authorInitials: "ET",
    category: "Community Challenge",
    replies: 56,
    likes: 89,
    lastActivity: "6 hours ago",
    isPinned: true,
    preview: "This week's challenge is to create micro-flows focused on morning routines. Share your creative approaches!"
  },
  {
    id: 4,
    title: "Career transition success metrics - what do you track?",
    author: "Marcus Rodriguez", 
    authorInitials: "MR",
    category: "Career Growth",
    replies: 12,
    likes: 28,
    lastActivity: "1 day ago",
    isPinned: false,
    preview: "I'm curious about what KPIs other career coaches use to measure flow effectiveness..."
  },
  {
    id: 5,
    title: "Integrating mindfulness techniques across different flow types",
    author: "Dr. James Mitchell",
    authorInitials: "JM", 
    category: "Wellness",
    replies: 34,
    likes: 67,
    lastActivity: "1 day ago",
    isPinned: false,
    preview: "Mindfulness can enhance any flow type. Let's discuss creative ways to weave it into various therapeutic approaches..."
  }
];

const CommunityDiscussion = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Community Discussions
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Join conversations with fellow creators and share insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Discussions */}
        <div className="lg:col-span-2 space-y-6">
          {discussions.map((discussion) => (
            <Card key={discussion.id} className="border hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {discussion.isPinned && (
                      <Pin className="w-4 h-4 text-primary" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">
                        {discussion.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Avatar className="w-5 h-5 mr-2">
                          <AvatarFallback className="text-xs">
                            {discussion.authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        {discussion.author}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={discussion.isPinned ? "default" : "secondary"} className="text-xs">
                    {discussion.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {discussion.preview}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {discussion.replies} replies
                    </div>
                    <div className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {discussion.likes}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {discussion.lastActivity}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              Load More Discussions
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Join the Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="spiritual">
                Start New Discussion
              </Button>
              <Button className="w-full" variant="outline">
                Browse Categories
              </Button>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Flow Creation", count: 156 },
                  { name: "Mental Health", count: 98 },
                  { name: "Career Growth", count: 76 },
                  { name: "Wellness", count: 54 },
                  { name: "Community Challenges", count: 43 }
                ].map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground hover:text-primary cursor-pointer">
                      {category.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be respectful and supportive</li>
                <li>• Share knowledge generously</li>
                <li>• Keep discussions constructive</li>
                <li>• Respect privacy and confidentiality</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CommunityDiscussion;