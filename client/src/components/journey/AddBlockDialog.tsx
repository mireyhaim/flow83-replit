import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  HelpCircle, 
  CheckSquare, 
  Heart,
  Play,
  Wand2
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  content: string | { title?: string; description?: string; url: string; mediaType?: string };
}

interface AddBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (block: Block) => void;
}

const blockTypes = [
  {
    type: "text",
    icon: FileText,
    label: "תוכן טקסט",
    description: "הוסף תוכן חינוכי, תובנות או הנחיות",
    placeholder: "שתף תובנות או הנחיות לשלב הזה...",
    inputType: "textarea"
  },
  {
    type: "question",
    icon: HelpCircle,
    label: "שאלת רפלקציה",
    description: "עודד רפלקציה עמוקה ומודעות עצמית",
    placeholder: "איזו שאלה תעזור להם להרהר לעומק בנושא?",
    inputType: "textarea"
  },
  {
    type: "task",
    icon: CheckSquare,
    label: "משימה",
    description: "תן להם משהו קונקרטי לעשות או לתרגל",
    placeholder: "איזו פעולה או תרגול יתמכו בצמיחה שלהם?",
    inputType: "textarea"
  },
  {
    type: "meditation",
    icon: Heart,
    label: "מדיטציה/תרגול",
    description: "הנחה אותם דרך תרגול מיינדפולנס או רוחני",
    placeholder: "תאר את המדיטציה, תרגיל הנשימה או התרגול הרוחני...",
    inputType: "textarea"
  },
  {
    type: "media",
    icon: Play,
    label: "מדיה (וידאו/אודיו)",
    description: "הוסף לינק לסרטון, מדיטציה מוקלטת או הסבר",
    placeholder: "",
    inputType: "media"
  }
];

const AddBlockDialog = ({ isOpen, onClose, onAdd }: AddBlockDialogProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [content, setContent] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const detectMediaType = (url: string): string => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("vimeo.com")) return "vimeo";
    if (url.includes("spotify.com")) return "spotify";
    if (url.includes("soundcloud.com")) return "soundcloud";
    if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) return "audio";
    if (url.match(/\.(mp4|webm|mov)$/i)) return "video";
    return "link";
  };

  const handleAdd = () => {
    if (!selectedType) return;

    if (selectedType === "media") {
      if (!mediaUrl.trim()) return;
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: "media",
        content: {
          title: mediaTitle.trim() || undefined,
          description: mediaDescription.trim() || undefined,
          url: mediaUrl.trim(),
          mediaType: detectMediaType(mediaUrl.trim())
        }
      };
      onAdd(newBlock);
    } else {
      if (!content.trim()) return;
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: selectedType,
        content: content.trim()
      };
      onAdd(newBlock);
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedType("");
    setContent("");
    setMediaTitle("");
    setMediaDescription("");
    setMediaUrl("");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const selectedBlockType = blockTypes.find(type => type.type === selectedType);
  const isMediaValid = selectedType === "media" ? mediaUrl.trim().length > 0 : content.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>הוסף בלוק חדש</DialogTitle>
          <DialogDescription>
            בחר את סוג התוכן שברצונך להוסיף לשלב הזה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {blockTypes.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  onClick={() => setSelectedType(blockType.type)}
                  className={`p-4 text-left border rounded-lg transition-all hover:border-primary/50 ${
                    selectedType === blockType.type
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid={`button-block-type-${blockType.type}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{blockType.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {blockType.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedType && selectedType !== "media" && (
            <div className="space-y-3">
              <Label htmlFor="content">תוכן</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedBlockType?.placeholder}
                rows={6}
                className="w-full"
                dir="rtl"
                data-testid="textarea-block-content"
              />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wand2 className="w-4 h-4" />
                <span>צריך עזרה? לחץ על "כתוב מחדש עם AI" אחרי ההוספה</span>
              </div>
            </div>
          )}

          {selectedType === "media" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mediaUrl">לינק למדיה *</Label>
                <Input
                  id="mediaUrl"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... או לינק לספוטיפיי/סאונדקלאוד..."
                  className="w-full"
                  dir="ltr"
                  data-testid="input-media-url"
                />
                <p className="text-xs text-muted-foreground">
                  נתמך: YouTube, Vimeo, Spotify, SoundCloud או לינק ישיר לקובץ
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mediaTitle">כותרת (אופציונלי)</Label>
                <Input
                  id="mediaTitle"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="לדוגמה: מדיטציית בוקר של 5 דקות"
                  className="w-full"
                  dir="rtl"
                  data-testid="input-media-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mediaDescription">תיאור (אופציונלי)</Label>
                <Textarea
                  id="mediaDescription"
                  value={mediaDescription}
                  onChange={(e) => setMediaDescription(e.target.value)}
                  placeholder="תיאור קצר של התוכן..."
                  rows={2}
                  className="w-full"
                  dir="rtl"
                  data-testid="textarea-media-description"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-add-block">
              ביטול
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedType || !isMediaValid}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-block"
            >
              הוסף בלוק
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBlockDialog;
