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
    placeholder: "Share your insights or guidance for this step...",
    inputType: "textarea"
  },
  {
    type: "question",
    icon: HelpCircle,
    label: "Reflection Question",
    description: "Encourage deep reflection and self-awareness",
    placeholder: "What question will help them reflect deeply on this topic?",
    inputType: "textarea"
  },
  {
    type: "task",
    icon: CheckSquare,
    label: "Task",
    description: "Give them something concrete to do or practice",
    placeholder: "What action or practice will support their growth?",
    inputType: "textarea"
  },
  {
    type: "meditation",
    icon: Heart,
    label: "Meditation/Practice",
    description: "Guide them through a mindfulness or spiritual practice",
    placeholder: "Describe the meditation, breathing exercise, or spiritual practice...",
    inputType: "textarea"
  },
  {
    type: "video",
    icon: Video,
    label: "Video",
    description: "Add a personal video message or lesson",
    placeholder: "Paste the video link here (YouTube, Vimeo, or direct link)...",
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
                  data-testid="input-block-content"
                />
              ) : (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={selectedBlockType?.placeholder}
                  rows={6}
                  className="w-full"
                  data-testid="textarea-block-content"
                />
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wand2 className="w-4 h-4" />
                <span>Need help? Click "Rewrite with AI" after adding for suggestions</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-add-block">
              Cancel
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedType || !content.trim()}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-block"
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
