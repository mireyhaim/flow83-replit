import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Edit2, Check, X, Target, BookOpen, CheckSquare } from "lucide-react";

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
  const [editTitle, setEditTitle] = useState(step.title);
  const [editingField, setEditingField] = useState<string | null>(null);

  const goalBlock = step.blocks.find(b => b.type === 'goal') || { id: '', type: 'goal', content: '' };
  const explanationBlock = step.blocks.find(b => b.type === 'text' || b.type === 'explanation') || { id: '', type: 'explanation', content: '' };
  const taskBlock = step.blocks.find(b => b.type === 'task') || { id: '', type: 'task', content: '' };

  const [editGoal, setEditGoal] = useState(goalBlock.content);
  const [editExplanation, setEditExplanation] = useState(explanationBlock.content);
  const [editTask, setEditTask] = useState(taskBlock.content);

  const handleSaveTitle = () => {
    onUpdate({ title: editTitle });
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setEditTitle(step.title);
    setIsEditingTitle(false);
  };

  const handleSaveField = (field: string) => {
    if (field === 'goal') {
      if (goalBlock.id && onUpdateBlock) {
        onUpdateBlock(goalBlock.id, editGoal);
      } else if (onAddBlock && editGoal.trim()) {
        onAddBlock('goal', editGoal);
      }
    } else if (field === 'explanation') {
      if (explanationBlock.id && onUpdateBlock) {
        onUpdateBlock(explanationBlock.id, editExplanation);
      } else if (onAddBlock && editExplanation.trim()) {
        onAddBlock('text', editExplanation);
      }
    } else if (field === 'task') {
      if (taskBlock.id && onUpdateBlock) {
        onUpdateBlock(taskBlock.id, editTask);
      } else if (onAddBlock && editTask.trim()) {
        onAddBlock('task', editTask);
      }
    }
    setEditingField(null);
  };

  const handleCancelField = (field: string) => {
    if (field === 'goal') setEditGoal(goalBlock.content);
    if (field === 'explanation') setEditExplanation(explanationBlock.content);
    if (field === 'task') setEditTask(taskBlock.content);
    setEditingField(null);
  };

  const renderEditableSection = (
    field: string,
    icon: React.ReactNode,
    label: string,
    value: string,
    editValue: string,
    setEditValue: (val: string) => void,
    color: string
  ) => (
    <div className={`p-4 rounded-lg border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="font-semibold text-sm">{label}</Label>
        </div>
        {editingField !== field && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setEditingField(field)}
            data-testid={`button-edit-${field}`}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {editingField === field ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full"
            placeholder={`Enter ${label.toLowerCase()}...`}
            data-testid={`textarea-${field}`}
          />
          <div className="flex justify-start gap-2">
            <Button size="sm" variant="outline" onClick={() => handleCancelField(field)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => handleSaveField(field)}>
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed" data-testid={`text-${field}`}>
          {value || <span className="italic text-muted-foreground">Click to edit...</span>}
        </p>
      )}
    </div>
  );

  return (
    <Card className="shadow-spiritual border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors" data-testid={`step-card-${step.id}`}>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold shadow-sm">
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
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {renderEditableSection(
            'goal',
            <Target className="w-4 h-4 text-purple-600" />,
            "Day's Goal",
            goalBlock.content,
            editGoal,
            setEditGoal,
            'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800'
          )}
          
          {renderEditableSection(
            'explanation',
            <BookOpen className="w-4 h-4 text-blue-600" />,
            'Explanation',
            explanationBlock.content,
            editExplanation,
            setEditExplanation,
            'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
          )}
          
          {renderEditableSection(
            'task',
            <CheckSquare className="w-4 h-4 text-green-600" />,
            'Task for User',
            taskBlock.content,
            editTask,
            setEditTask,
            'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default JourneyStep;
