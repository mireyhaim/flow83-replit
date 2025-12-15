import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContentBlock from "@/components/ContentBlock";
import AddBlockDialog from "@/components/AddBlockDialog";
import { ChevronDown, ChevronUp, Plus, Edit2, Check, X } from "lucide-react";

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

interface JourneyStepProps {
  step: Step;
  stepNumber: number;
  onUpdate: (updatedStep: Partial<Step>) => void;
}

const JourneyStep = ({ step, stepNumber, onUpdate }: JourneyStepProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState(step.title);
  const [editDescription, setEditDescription] = useState(step.description);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const handleSaveTitle = () => {
    onUpdate({ title: editTitle });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    onUpdate({ description: editDescription });
    setIsEditingDescription(false);
  };

  const handleCancelTitle = () => {
    setEditTitle(step.title);
    setIsEditingTitle(false);
  };

  const handleCancelDescription = () => {
    setEditDescription(step.description);
    setIsEditingDescription(false);
  };

  const addBlock = (newBlock: Block) => {
    const updatedBlocks = [...step.blocks, newBlock];
    onUpdate({ blocks: updatedBlocks });
  };

  const updateBlock = (blockId: string, updatedContent: string) => {
    const updatedBlocks = step.blocks.map(block =>
      block.id === blockId ? { ...block, content: updatedContent } : block
    );
    onUpdate({ blocks: updatedBlocks });
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = step.blocks.filter(block => block.id !== blockId);
    onUpdate({ blocks: updatedBlocks });
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = step.blocks.findIndex(block => block.id === blockId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === step.blocks.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedBlocks = [...step.blocks];
    [updatedBlocks[currentIndex], updatedBlocks[newIndex]] = 
    [updatedBlocks[newIndex], updatedBlocks[currentIndex]];
    
    onUpdate({ blocks: updatedBlocks });
  };

  return (
    <Card className="shadow-spiritual">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {stepNumber}
            </div>
            
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-semibold"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveTitle}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelTitle}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {isEditingDescription ? (
              <div className="flex items-start gap-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={handleSaveDescription}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelDescription}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-muted-foreground flex-1">{step.description}</p>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingDescription(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {step.blocks.map((block, index) => (
              <ContentBlock
                key={block.id}
                block={block}
                onUpdate={(content) => updateBlock(block.id, content)}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={index > 0 ? () => moveBlock(block.id, 'up') : undefined}
                onMoveDown={index < step.blocks.length - 1 ? () => moveBlock(block.id, 'down') : undefined}
              />
            ))}

            <div className="pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => setShowAddBlock(true)}
                className="gap-2 w-full"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
            </div>
          </div>

          <AddBlockDialog
            isOpen={showAddBlock}
            onClose={() => setShowAddBlock(false)}
            onAdd={addBlock}
          />
        </CardContent>
      )}
    </Card>
  );
};

export default JourneyStep;