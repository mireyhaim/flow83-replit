import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContentBlock from "./ContentBlock";
import AddBlockDialog from "./AddBlockDialog";
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
  onAddBlock?: (type: string, content: string) => void;
  onUpdateBlock?: (blockId: string, content: string) => void;
  onDeleteBlock?: (blockId: string) => void;
}

const JourneyStep = ({ 
  step, 
  stepNumber, 
  onUpdate, 
  onAddBlock, 
  onUpdateBlock, 
  onDeleteBlock 
}: JourneyStepProps) => {
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
    if (onAddBlock) {
      onAddBlock(newBlock.type, newBlock.content);
    } else {
      const updatedBlocks = [...step.blocks, newBlock];
      onUpdate({ blocks: updatedBlocks });
    }
  };

  const updateBlock = (blockId: string, updatedContent: string) => {
    if (onUpdateBlock) {
      onUpdateBlock(blockId, updatedContent);
    } else {
      const updatedBlocks = step.blocks.map(block =>
        block.id === blockId ? { ...block, content: updatedContent } : block
      );
      onUpdate({ blocks: updatedBlocks });
    }
  };

  const deleteBlock = (blockId: string) => {
    if (onDeleteBlock) {
      onDeleteBlock(blockId);
    } else {
      const updatedBlocks = step.blocks.filter(block => block.id !== blockId);
      onUpdate({ blocks: updatedBlocks });
    }
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
    <Card className="shadow-spiritual" data-testid={`step-card-${step.id}`}>
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
                    data-testid="input-step-title"
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveTitle} data-testid="button-save-title">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelTitle} data-testid="button-cancel-title">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold" data-testid="text-step-title">{step.title}</h3>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    data-testid="button-edit-title"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" data-testid="button-toggle-expand">
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
                  data-testid="textarea-step-description"
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="ghost" onClick={handleSaveDescription} data-testid="button-save-description">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelDescription} data-testid="button-cancel-description">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-muted-foreground flex-1" data-testid="text-step-description">{step.description}</p>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingDescription(true);
                  }}
                  data-testid="button-edit-description"
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
                data-testid="button-add-block"
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
