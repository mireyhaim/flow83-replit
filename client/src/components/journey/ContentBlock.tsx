import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Edit2, 
  Check, 
  X, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Wand2,
  FileText,
  HelpCircle,
  CheckSquare,
  Heart,
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Block {
  id: string;
  type: string;
  content: string;
}

interface ContentBlockProps {
  block: Block;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const blockTypeConfig = {
  text: { icon: FileText, label: "טקסט", color: "bg-blue-100 text-blue-800" },
  question: { icon: HelpCircle, label: "שאלה", color: "bg-purple-100 text-purple-800" },
  task: { icon: CheckSquare, label: "משימה", color: "bg-green-100 text-green-800" },
  meditation: { icon: Heart, label: "מדיטציה", color: "bg-pink-100 text-pink-800" },
  video: { icon: Video, label: "סרטון", color: "bg-orange-100 text-orange-800" }
};

const ContentBlock = ({ block, onUpdate, onDelete, onMoveUp, onMoveDown }: ContentBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);
  const { toast } = useToast();

  const blockConfig = blockTypeConfig[block.type as keyof typeof blockTypeConfig] || blockTypeConfig.text;
  const Icon = blockConfig.icon;

  const handleSave = () => {
    onUpdate(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(block.content);
    setIsEditing(false);
  };

  const handleRewriteWithAI = () => {
    toast({
      title: "שכתוב עם AI",
      description: "מייצר הצעות AI לבלוק זה.",
    });
  };

  return (
    <Card className="border-r-4 border-r-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className={blockConfig.color}>
              {blockConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <Button size="sm" variant="ghost" onClick={onMoveUp}>
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button size="sm" variant="ghost" onClick={onMoveDown}>
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleRewriteWithAI}>
              <Wand2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full"
            />
            <div className="flex justify-start gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 ml-1" />
                ביטול
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="w-4 h-4 ml-1" />
                שמור
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {block.type === 'video' && block.content.includes('http') ? (
              <div className="space-y-2">
                <video 
                  controls 
                  className="w-full rounded-lg"
                  style={{ maxHeight: '400px' }}
                >
                  <source src={block.content} />
                  הדפדפן שלך לא תומך בתג וידאו.
                </video>
                <p className="text-xs text-muted-foreground">סרטון: {block.content}</p>
              </div>
            ) : (
              <p className="text-foreground leading-relaxed">{block.content}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentBlock;
