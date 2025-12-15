import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText,
  HelpCircle,
  CheckSquare,
  Heart,
  Video,
  Check,
  Edit3
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  content: string;
}

interface Step {
  id: string;
  day: number;
  title: string;
  description: string;
  blocks: Block[];
}

interface JourneyStepPreviewProps {
  step: Step;
  stepNumber: number;
}

const blockTypeConfig = {
  text: { icon: FileText, label: "Reflection", color: "bg-blue-50 text-blue-700 border-blue-200" },
  question: { icon: HelpCircle, label: "Question", color: "bg-purple-50 text-purple-700 border-purple-200" },
  task: { icon: CheckSquare, label: "Practice", color: "bg-green-50 text-green-700 border-green-200" },
  meditation: { icon: Heart, label: "Meditation", color: "bg-pink-50 text-pink-700 border-pink-200" },
  video: { icon: Video, label: "Video", color: "bg-orange-50 text-orange-700 border-orange-200" }
};

const JourneyStepPreview = ({ step, stepNumber }: JourneyStepPreviewProps) => {
  const [responses, setResponses] = useState<{[key: string]: string}>({});
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());

  const handleResponseChange = (blockId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [blockId]: value
    }));
  };

  const markBlockComplete = (blockId: string) => {
    setCompletedBlocks(prev => new Set([...prev, blockId]));
  };

  const isBlockComplete = (blockId: string) => {
    return completedBlocks.has(blockId);
  };

  return (
    <div className="p-8">
      {/* Step Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xl mb-4">
          {stepNumber}
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {step.title}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {step.description}
        </p>
      </div>

      {/* Blocks */}
      <div className="space-y-6">
        {step.blocks.map((block, index) => {
          const blockConfig = blockTypeConfig[block.type as keyof typeof blockTypeConfig] || blockTypeConfig.text;
          const Icon = blockConfig.icon;
          const isComplete = isBlockComplete(block.id);

          return (
            <Card key={block.id} className={`border-l-4 border-l-primary/30 ${isComplete ? 'bg-muted/30' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                  <Badge variant="secondary" className={`${blockConfig.color} border`}>
                    {blockConfig.label}
                  </Badge>
                  {isComplete && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>

                <div className="prose prose-lg max-w-none mb-6">
                  {block.type === 'video' && block.content.includes('http') ? (
                    <div className="space-y-3">
                      <video 
                        controls 
                        className="w-full rounded-lg"
                        style={{ maxHeight: '500px' }}
                      >
                        <source src={block.content} />
                        Your browser does not support the video tag.
                      </video>
                      <p className="text-sm text-muted-foreground text-center">
                        Video message from your guide
                      </p>
                    </div>
                  ) : (
                    <p className="text-foreground leading-relaxed">
                      {block.content}
                    </p>
                  )}
                </div>

                {/* Interactive Elements */}
                {(block.type === 'question' || block.type === 'task') && (
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Your Response
                      </span>
                    </div>
                    <Textarea
                      value={responses[block.id] || ''}
                      onChange={(e) => handleResponseChange(block.id, e.target.value)}
                      placeholder="Take your time to reflect and write your thoughts..."
                      rows={4}
                      className="mb-3 bg-background"
                      disabled={isComplete}
                    />
                    {!isComplete && (
                      <Button 
                        onClick={() => markBlockComplete(block.id)}
                        disabled={!responses[block.id]?.trim()}
                        size="sm"
                        className="gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                )}

                {block.type === 'meditation' && (
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
                    <div className="text-center">
                      {!isComplete ? (
                        <Button 
                          onClick={() => markBlockComplete(block.id)}
                          className="gap-2 bg-gradient-to-r from-primary to-accent"
                        >
                          <Heart className="w-4 h-4" />
                          Begin Practice
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Practice Complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(block.type === 'text' || block.type === 'video') && !isComplete && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => markBlockComplete(block.id)}
                      size="sm"
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {block.type === 'video' ? "I've watched this" : "I've reflected on this"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step Completion */}
      {completedBlocks.size === step.blocks.length && (
        <div className="mt-8 text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Day {stepNumber} Complete!
          </h3>
          <p className="text-muted-foreground">
            Beautiful work today. Take a moment to honor your growth and progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default JourneyStepPreview;