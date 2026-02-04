import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Play,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MediaEmbed } from "@/components/ui/media-embed";

interface MediaContent {
  title?: string;
  description?: string;
  url: string;
  mediaType?: string;
}

interface Block {
  id: string;
  type: string;
  content: string | MediaContent;
}

interface ContentBlockProps {
  block: Block;
  onUpdate: (content: string | MediaContent) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const blockTypeConfig = {
  text: { icon: FileText, label: "טקסט", color: "bg-blue-100 text-blue-800" },
  question: { icon: HelpCircle, label: "שאלה", color: "bg-purple-100 text-purple-800" },
  task: { icon: CheckSquare, label: "משימה", color: "bg-green-100 text-green-800" },
  meditation: { icon: Heart, label: "מדיטציה", color: "bg-pink-100 text-pink-800" },
  video: { icon: Play, label: "וידאו", color: "bg-orange-100 text-orange-800" },
  media: { icon: Play, label: "מדיה", color: "bg-cyan-100 text-cyan-800" }
};

const ContentBlock = ({ block, onUpdate, onDelete, onMoveUp, onMoveDown }: ContentBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  const isMediaBlock = block.type === 'media' || (block.type === 'video' && typeof block.content === 'object');
  const mediaContent = isMediaBlock && typeof block.content === 'object' ? block.content as MediaContent : null;
  const textContent = typeof block.content === 'string' ? block.content : '';
  
  const [editTextContent, setEditTextContent] = useState(textContent);
  const [editMediaUrl, setEditMediaUrl] = useState(mediaContent?.url || '');
  const [editMediaTitle, setEditMediaTitle] = useState(mediaContent?.title || '');
  const [editMediaDescription, setEditMediaDescription] = useState(mediaContent?.description || '');

  const blockConfig = blockTypeConfig[block.type as keyof typeof blockTypeConfig] || blockTypeConfig.text;
  const Icon = blockConfig.icon;

  const handleSave = () => {
    if (isMediaBlock || block.type === 'media') {
      onUpdate({
        title: editMediaTitle.trim() || undefined,
        description: editMediaDescription.trim() || undefined,
        url: editMediaUrl.trim(),
        mediaType: mediaContent?.mediaType
      });
    } else {
      onUpdate(editTextContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTextContent(textContent);
    setEditMediaUrl(mediaContent?.url || '');
    setEditMediaTitle(mediaContent?.title || '');
    setEditMediaDescription(mediaContent?.description || '');
    setIsEditing(false);
  };

  const handleRewriteWithAI = () => {
    toast({
      title: "כתוב מחדש עם AI",
      description: "מייצר הצעות AI לבלוק הזה.",
    });
  };

  return (
    <Card className="border-l-4 border-l-primary/30">
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
            {!isMediaBlock && (
              <Button size="sm" variant="ghost" onClick={handleRewriteWithAI}>
                <Wand2 className="w-4 h-4" />
              </Button>
            )}
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
            {isMediaBlock || block.type === 'media' ? (
              <div className="space-y-3">
                <div>
                  <Label>לינק למדיה</Label>
                  <Input
                    value={editMediaUrl}
                    onChange={(e) => setEditMediaUrl(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>כותרת (אופציונלי)</Label>
                  <Input
                    value={editMediaTitle}
                    onChange={(e) => setEditMediaTitle(e.target.value)}
                    placeholder="כותרת המדיה"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label>תיאור (אופציונלי)</Label>
                  <Textarea
                    value={editMediaDescription}
                    onChange={(e) => setEditMediaDescription(e.target.value)}
                    placeholder="תיאור קצר..."
                    rows={2}
                    dir="rtl"
                  />
                </div>
              </div>
            ) : (
              <Textarea
                value={editTextContent}
                onChange={(e) => setEditTextContent(e.target.value)}
                rows={4}
                className="w-full"
                dir="rtl"
              />
            )}
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
            {(isMediaBlock || block.type === 'media') && mediaContent ? (
              <div className="space-y-2">
                {mediaContent.title && (
                  <h4 className="font-medium text-foreground m-0">{mediaContent.title}</h4>
                )}
                {mediaContent.description && (
                  <p className="text-sm text-muted-foreground m-0">{mediaContent.description}</p>
                )}
                <MediaEmbed url={mediaContent.url} />
              </div>
            ) : block.type === 'video' && typeof block.content === 'string' && block.content.includes('http') ? (
              <div className="space-y-2">
                <MediaEmbed url={block.content} />
              </div>
            ) : (
              <p className="text-foreground leading-relaxed" dir="rtl">{textContent}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentBlock;
