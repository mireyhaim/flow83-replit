import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Journey {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  steps: number;
  thumbnail: string;
  difficulty: string;
}

interface JourneyCardProps {
  journey: Journey;
}

const JourneyCard = ({ journey }: JourneyCardProps) => {
  return (
    <Card className="gradient-card shadow-card hover:shadow-spiritual transition-all duration-300 hover:scale-105 border-0 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="text-6xl mb-4 text-center">
          {journey.thumbnail}
        </div>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            {journey.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {journey.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold text-foreground line-clamp-2">
          {journey.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-muted-foreground leading-relaxed mb-6 flex-1">
          {journey.description}
        </CardDescription>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {journey.duration}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {journey.steps} steps
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            asChild 
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Link to={`/journey/${journey.id}`}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Journey
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyCard;