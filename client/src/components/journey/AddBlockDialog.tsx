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
  Video,
  Wand2
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  content: string;
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
    placeholder: "שתף את התובנות או ההנחיות שלך עבור שלב זה...",
    inputType: "textarea"
  },
  {
    type: "question",
    icon: HelpCircle,
    label: "שאלת רפלקציה",
    description: "עודד התבוננות עמוקה ומודעות עצמית",
    placeholder: "איזו שאלה תעזור להם להתבונן לעומק על הנושא?",
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
    type: "video",
    icon: Video,
    label: "סרטון",
    description: "הוסף הודעת וידאו אישית או שיעור",
    placeholder: "הדבק את קישור הסרטון כאן (YouTube, Vimeo, או קישור ישיר)...",
    inputType: "input"
  }
];

const AddBlockDialog = ({ isOpen, onClose, onAdd }: AddBlockDialogProps) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [content, setContent] = useState("");

  const handleAdd = () => {
    if (!selectedType || !content.trim()) return;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: selectedType,
      content: content.trim()
    };

    onAdd(newBlock);
    setSelectedType("");
    setContent("");
    onClose();
  };

  const handleCancel = () => {
    setSelectedType("");
    setContent("");
    onClose();
  };

  const selectedBlockType = blockTypes.find(type => type.type === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת בלוק חדש</DialogTitle>
          <DialogDescription>
            בחר את סוג התוכן שברצונך להוסיף לשלב זה
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
                  className={`p-4 text-right border rounded-lg transition-all hover:border-primary/50 ${
                    selectedType === blockType.type
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
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

          {selectedType && (
            <div className="space-y-3">
              <Label htmlFor="content">תוכן</Label>
              {selectedBlockType?.inputType === "input" ? (
                <Input
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={selectedBlockType?.placeholder}
                  className="w-full"
                />
              ) : (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={selectedBlockType?.placeholder}
                  rows={6}
                  className="w-full"
                />
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wand2 className="w-4 h-4" />
                <span>צריך עזרה? לחץ על "שכתב עם AI" לאחר ההוספה לקבלת הצעות</span>
              </div>
            </div>
          )}

          <div className="flex justify-start gap-3">
            <Button variant="outline" onClick={handleCancel}>
              ביטול
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedType || !content.trim()}
              className="bg-primary hover:bg-primary/90"
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
