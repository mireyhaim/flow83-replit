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
    label: "Text Content",
    description: "Add educational content, insights, or guidance",
    placeholder: "Share your wisdom, insights, or guidance for this step...",
    inputType: "textarea"
  },
  {
    type: "question",
    icon: HelpCircle,
    label: "Reflection Question",
    description: "Prompt deep self-reflection and awareness",
    placeholder: "What question will help them reflect deeply on this topic?",
    inputType: "textarea"
  },
  {
    type: "task",
    icon: CheckSquare,
    label: "Action Task",
    description: "Give them something concrete to do or practice",
    placeholder: "What action or practice would support their growth here?",
    inputType: "textarea"
  },
  {
    type: "meditation",
    icon: Heart,
    label: "Meditation/Practice",
    description: "Guide them through a mindful or spiritual practice",
    placeholder: "Describe the meditation, breathing exercise, or spiritual practice...",
    inputType: "textarea"
  },
  {
    type: "video",
    icon: Video,
    label: "Video Content",
    description: "Add a personal video message or teaching",
    placeholder: "Paste your video URL here (YouTube, Vimeo, or direct link)...",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Block</DialogTitle>
          <DialogDescription>
            Choose the type of content you want to add to this step
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Block Type Selection */}
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

          {/* Content Input */}
          {selectedType && (
            <div className="space-y-3">
              <Label htmlFor="content">Content</Label>
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
                <span>Need help? Click "Rewrite with AI" after adding to get suggestions</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedType || !content.trim()}
            >
              Add Block
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBlockDialog;