import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { journeyApi, fileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileText, 
  X, 
  Sparkles,
  Check,
  Loader2,
  Pencil,
  Globe,
  Calendar,
  Type,
  Users,
  Target,
  MessageCircle,
  FileUp,
  Heart
} from "lucide-react";

interface JourneyData {
  language: string;
  journeyName: string;
  targetAudience: string;
  mainGoal: string;
  duration: number[];
  profession: string;
  tone: string;
  mentorStyle: string;
  clientChallenges: string;
  additionalNotes: string;
}

type StepId = 'language' | 'duration' | 'journeyName' | 'targetAudience' | 'mainGoal' | 'tone' | 'mentorStyle' | 'content';

interface Step {
  id: StepId;
  icon: React.ElementType;
  labelEn: string;
  labelHe: string;
  questionEn: string;
  questionHe: string;
  type: 'options' | 'text' | 'textarea' | 'file';
  options?: { value: string; labelEn: string; labelHe: string }[];
}

const steps: Step[] = [
  {
    id: 'language',
    icon: Globe,
    labelEn: 'Language',
    labelHe: 'שפה',
    questionEn: "Hi! I'm here to help you create a transformational Flow. What language will your Flow be in?",
    questionHe: 'היי! אני כאן לעזור לך ליצור Flow טרנספורמטיבי. באיזו שפה יהיה ה-Flow?',
    type: 'options',
    options: [
      { value: 'he', labelEn: 'עברית', labelHe: 'עברית' },
      { value: 'en', labelEn: 'English', labelHe: 'English' }
    ]
  },
  {
    id: 'duration',
    icon: Calendar,
    labelEn: 'Duration',
    labelHe: 'משך',
    questionEn: 'How many days will your Flow last?',
    questionHe: 'כמה ימים יימשך ה-Flow?',
    type: 'options',
    options: [
      { value: '3', labelEn: '3 days', labelHe: '3 ימים' },
      { value: '7', labelEn: '7 days', labelHe: '7 ימים' }
    ]
  },
  {
    id: 'journeyName',
    icon: Type,
    labelEn: 'Name',
    labelHe: 'שם',
    questionEn: 'What will be the name of your Flow?',
    questionHe: 'מה יהיה שם ה-Flow?',
    type: 'text'
  },
  {
    id: 'targetAudience',
    icon: Users,
    labelEn: 'Audience',
    labelHe: 'קהל יעד',
    questionEn: 'Who is your target audience? Describe the people who will go through this Flow.',
    questionHe: 'מי קהל היעד שלך? תאר את האנשים שיעברו את ה-Flow הזה.',
    type: 'textarea'
  },
  {
    id: 'mainGoal',
    icon: Target,
    labelEn: 'Goal',
    labelHe: 'מטרה',
    questionEn: 'What is the main goal of this Flow? What will participants achieve by the end?',
    questionHe: 'מה המטרה העיקרית של ה-Flow? מה המשתתפים ישיגו בסוף?',
    type: 'textarea'
  },
  {
    id: 'tone',
    icon: MessageCircle,
    labelEn: 'Tone',
    labelHe: 'טון',
    questionEn: 'What tone would you like your Flow to have?',
    questionHe: 'באיזה טון תרצה שה-Flow ידבר?',
    type: 'options',
    options: [
      { value: 'warm', labelEn: 'Warm & Supportive', labelHe: 'חם ותומך' },
      { value: 'professional', labelEn: 'Professional', labelHe: 'מקצועי' },
      { value: 'motivating', labelEn: 'Motivating', labelHe: 'מניע לפעולה' },
      { value: 'spiritual', labelEn: 'Spiritual', labelHe: 'רוחני' }
    ]
  },
  {
    id: 'mentorStyle',
    icon: Heart,
    labelEn: 'Style',
    labelHe: 'סגנון',
    questionEn: 'How would you describe your style as a mentor?',
    questionHe: 'איך היית מתאר את הסגנון שלך כמלווה?',
    type: 'options',
    options: [
      { value: 'practical', labelEn: '🎯 Practical - Exercises & Tasks', labelHe: '🎯 פרקטי - תרגילים ומשימות' },
      { value: 'emotional', labelEn: '💭 Emotional - Deep Listening', labelHe: '💭 רגשי - הקשבה עמוקה' },
      { value: 'spiritual', labelEn: '🌿 Spiritual - Metaphors & Imagery', labelHe: '🌿 רוחני - מטאפורות ודמיון' },
      { value: 'structured', labelEn: '📋 Structured - Clear Process', labelHe: '📋 מובנה - תהליך מסודר' }
    ]
  },
  {
    id: 'content',
    icon: FileUp,
    labelEn: 'Content',
    labelHe: 'תוכן',
    questionEn: "Now it's time to upload your content. Upload files or paste text - I'll transform it into an amazing Flow.",
    questionHe: 'עכשיו הגיע הזמן להעלות את התוכן שלך. העלה קבצים או הדבק טקסט - אני אהפוך אותו ל-Flow מדהים.',
    type: 'file'
  }
];

const ConversationalJourneyWizard = () => {
  const { i18n } = useTranslation('dashboard');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isHebrew = i18n.language === 'he';
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [journeyData, setJourneyData] = useState<JourneyData>({
    language: '',
    journeyName: '',
    targetAudience: '',
    mainGoal: '',
    duration: [],
    profession: '',
    tone: '',
    mentorStyle: '',
    clientChallenges: '',
    additionalNotes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentStep = steps[currentStepIndex];

  const getValueForStep = (stepId: StepId): string => {
    if (stepId === 'duration') {
      return journeyData.duration[0]?.toString() || '';
    }
    if (stepId === 'content') {
      if (uploadedFiles.length > 0) return `${uploadedFiles.length} files`;
      if (textContent) return 'Text content';
      return '';
    }
    return journeyData[stepId as keyof JourneyData] as string || '';
  };

  const getDisplayValue = (stepId: StepId): string => {
    const value = getValueForStep(stepId);
    if (!value) return '';
    
    const step = steps.find(s => s.id === stepId);
    if (step?.options) {
      const option = step.options.find(o => o.value === value);
      if (option) return isHebrew ? option.labelHe : option.labelEn;
    }
    
    if (stepId === 'duration') {
      return `${value} ${isHebrew ? 'ימים' : 'days'}`;
    }
    
    if (stepId === 'content') {
      if (uploadedFiles.length > 0) return `${uploadedFiles.length} ${isHebrew ? 'קבצים' : 'files'}`;
      if (textContent) return isHebrew ? 'טקסט' : 'Text';
      return '';
    }
    
    return value.length > 30 ? value.substring(0, 30) + '...' : value;
  };

  const handleOptionSelect = (value: string) => {
    const stepId = currentStep.id;
    
    if (stepId === 'duration') {
      setJourneyData(prev => ({ ...prev, duration: [parseInt(value)] }));
    } else {
      setJourneyData(prev => ({ ...prev, [stepId]: value }));
    }
    
    setTimeout(() => {
      if (editingStep !== null) {
        setEditingStep(null);
        // Go to next step after the edited one, not to the end
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        }
      } else if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleTextSubmit = () => {
    if (!inputValue.trim()) return;
    
    const stepId = currentStep.id;
    setJourneyData(prev => ({ ...prev, [stepId]: inputValue }));
    setInputValue('');
    
    setTimeout(() => {
      if (editingStep !== null) {
        setEditingStep(null);
        // Go to next step after the edited one, not to the end
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        }
      } else if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleEditStep = (index: number) => {
    if (isGenerating) return;
    const step = steps[index];
    setEditingStep(index);
    setCurrentStepIndex(index);
    
    const currentValue = getValueForStep(step.id);
    if (step.type === 'text' || step.type === 'textarea') {
      setInputValue(currentValue);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || 
      file.type.includes('word') || 
      file.type === 'text/plain'
    );
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (uploadedFiles.length === 0 && !textContent.trim()) {
      toast({
        title: isHebrew ? 'נדרש תוכן' : 'Content required',
        description: isHebrew ? 'העלה קבצים או הדבק טקסט' : 'Upload files or paste text',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let content = textContent;
      
      if (uploadedFiles.length > 0) {
        setProgressMessage(isHebrew ? 'קורא את הקבצים...' : 'Reading files...');
        const parsed = await fileApi.parseFiles(uploadedFiles, signal);
        content = content + "\n\n" + parsed.text;
      }

      setProgressMessage(isHebrew ? 'יוצר את ה-Flow...' : 'Creating Flow...');
      setProgress(5);

      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration[0],
        status: "draft",
        description: journeyData.additionalNotes || "",
        language: journeyData.language,
        clientChallenges: journeyData.clientChallenges || "",
        profession: journeyData.profession || "",
        tone: journeyData.tone || "",
        mentorStyle: journeyData.mentorStyle || "",
      }, signal);

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      await journeyApi.generateContentWithProgress(journey.id, content.trim(), (prog, msg) => {
        setProgress(prog);
        setProgressMessage(msg);
      }, signal);

      setLocation(`/journey/${journey.id}/edit`);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Generation error:', error);
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew ? 'אירעה שגיאה ביצירת ה-Flow' : 'An error occurred creating the Flow',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const hasContent = uploadedFiles.length > 0 || textContent.trim().length > 0;
  const canGenerate = journeyData.language && journeyData.duration[0] && 
                      journeyData.journeyName && journeyData.targetAudience && 
                      journeyData.mainGoal && journeyData.tone && hasContent;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-[#0f0a1f] via-[#1a1030] to-[#0f0a1f] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-[calc(100vh-56px)]">
        <div className="hidden lg:flex w-72 flex-col border-e border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-white/80 text-sm font-medium">
              {isHebrew ? 'בניית ה-Flow' : 'Building Your Flow'}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <div className="relative">
              <div className="absolute top-0 bottom-0 start-[18px] w-px bg-gradient-to-b from-violet-600/50 via-violet-600/20 to-transparent" />
              
              <div className="space-y-1">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const value = getDisplayValue(step.id);
                  const isActive = index === currentStepIndex;
                  const isCompleted = value && index !== currentStepIndex;
                  const isFuture = index > currentStepIndex && !value;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                        isActive ? 'bg-violet-600/20' : isCompleted ? 'hover:bg-white/5' : ''
                      } ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}`}
                      onClick={() => !isFuture && !isGenerating && handleEditStep(index)}
                      data-testid={`step-${step.id}`}
                    >
                      <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isActive ? 'bg-violet-600 shadow-lg shadow-violet-600/30' : 
                        isCompleted ? 'bg-violet-600/30' : 
                        'bg-white/10'
                      }`}>
                        {isCompleted && !isActive ? (
                          <Check className="w-4 h-4 text-violet-300" />
                        ) : (
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {isHebrew ? step.labelHe : step.labelEn}
                        </p>
                        {value && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-sm text-violet-300 truncate mt-0.5"
                          >
                            {value}
                          </motion.p>
                        )}
                      </div>
                      
                      {isCompleted && !isActive && !isGenerating && (
                        <Pencil className="w-3.5 h-3.5 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
              <AnimatePresence mode="wait">
                {!isGenerating ? (
                  <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-white/10 flex items-center justify-center"
                      >
                        <currentStep.icon className="w-6 h-6 text-violet-400" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="text-xl md:text-2xl text-white font-light leading-relaxed max-w-lg mx-auto"
                      >
                        {isHebrew ? currentStep.questionHe : currentStep.questionEn}
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {currentStep.type === 'options' && currentStep.options && (
                        <div className="flex flex-wrap justify-center gap-3">
                          {currentStep.options.map((option, idx) => {
                            const isSelected = getValueForStep(currentStep.id) === option.value;
                            return (
                              <motion.button
                                key={option.value}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 + idx * 0.05 }}
                                onClick={() => handleOptionSelect(option.value)}
                                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/50 text-white'
                                }`}
                                data-testid={`option-${option.value}`}
                              >
                                {isHebrew ? option.labelHe : option.labelEn}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}

                      {currentStep.type === 'text' && (
                        <div className="flex gap-3 max-w-md mx-auto">
                          <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                            placeholder={isHebrew ? 'הקלד כאן...' : 'Type here...'}
                            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl text-center"
                            autoFocus
                            data-testid="input-text"
                          />
                          <Button 
                            onClick={handleTextSubmit}
                            disabled={!inputValue.trim()}
                            className="bg-violet-600 hover:bg-violet-700 h-12 px-6 rounded-xl disabled:opacity-50"
                            data-testid="button-submit"
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        </div>
                      )}

                      {currentStep.type === 'textarea' && (
                        <div className="space-y-3 max-w-md mx-auto">
                          <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isHebrew ? 'הקלד כאן...' : 'Type here...'}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[120px] rounded-xl resize-none"
                            autoFocus
                            data-testid="input-textarea"
                          />
                          <Button 
                            onClick={handleTextSubmit}
                            disabled={!inputValue.trim()}
                            className="w-full bg-violet-600 hover:bg-violet-700 h-12 rounded-xl disabled:opacity-50"
                            data-testid="button-submit"
                          >
                            {isHebrew ? 'המשך' : 'Continue'}
                          </Button>
                        </div>
                      )}

                      {currentStep.type === 'file' && (
                        <div className="space-y-4 max-w-md mx-auto">
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                              isDragging 
                                ? 'border-violet-500 bg-violet-500/10' 
                                : 'border-white/20 hover:border-white/40 bg-white/5'
                            }`}
                            data-testid="dropzone"
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) => handleFileUpload(e.target.files)}
                              className="hidden"
                              data-testid="input-file"
                            />
                            <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
                            <p className="text-white/70 text-sm">
                              {isHebrew ? 'גרור קבצים או לחץ להעלאה' : 'Drag files or click to upload'}
                            </p>
                            <p className="text-white/40 text-xs mt-1">PDF, Word, TXT</p>
                          </div>

                          {uploadedFiles.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-2"
                            >
                              {uploadedFiles.map((file, index) => (
                                <motion.div 
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
                                >
                                  <FileText className="w-5 h-5 text-violet-400" />
                                  <span className="flex-1 text-white/80 text-sm truncate">{file.name}</span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="text-white/40 hover:text-white"
                                    data-testid={`button-remove-file-${index}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-[#1a1030] px-3 text-white/40">
                                {isHebrew ? 'או' : 'or'}
                              </span>
                            </div>
                          </div>

                          <Textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder={isHebrew ? 'הדבק טקסט כאן...' : 'Paste text here...'}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px] rounded-xl resize-none"
                            data-testid="textarea-content"
                          />

                          <Button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid="button-generate"
                          >
                            <Sparkles className="w-5 h-5 me-2" />
                            {isHebrew ? 'צור את ה-Flow שלי' : 'Create My Flow'}
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8"
                  >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-white/10 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-8 h-8 text-violet-400" />
                      </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl text-white font-medium">
                        {isHebrew ? 'יוצר את ה-Flow שלך...' : 'Creating your Flow...'}
                      </h3>
                      <p className="text-white/60">{progressMessage}</p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-white/40 text-sm mt-2">{progress}%</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:hidden px-6 pb-6">
            <div className="flex gap-2 justify-center items-center">
              {steps.map((step, index) => {
                const value = getValueForStep(step.id);
                const isActive = index === currentStepIndex;
                const isCompleted = value && !isActive;
                const isFuture = index > currentStepIndex && !value;
                const Icon = step.icon;
                
                return (
                  <button
                    key={index}
                    onClick={() => !isFuture && !isGenerating && handleEditStep(index)}
                    disabled={isFuture || isGenerating}
                    className={`relative flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'w-10 h-10 bg-violet-600 rounded-full shadow-lg shadow-violet-600/30' 
                        : isCompleted 
                          ? 'w-8 h-8 bg-violet-600/30 rounded-full cursor-pointer hover:bg-violet-600/50' 
                          : 'w-6 h-6 bg-white/10 rounded-full opacity-40 cursor-not-allowed'
                    }`}
                    data-testid={`mobile-step-${step.id}`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="w-3.5 h-3.5 text-violet-300" />
                    ) : (
                      <Icon className={`${isActive ? 'w-4 h-4' : 'w-3 h-3'} ${isActive ? 'text-white' : 'text-white/50'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalJourneyWizard;
