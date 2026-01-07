import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, AlertCircle, Sparkles, X, Check, CloudUpload, Copy, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, fileApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface ContentUploadSectionProps {
  journeyData: any;
  onBack?: () => void;
}

const loadingMessages = [
  { he: "מנתח את התוכן שלך...", en: "Analyzing your content..." },
  { he: "לומד את הסגנון הייחודי שלך...", en: "Learning your unique style..." },
  { he: "מזהה נקודות מפתח...", en: "Identifying key points..." },
  { he: "בונה את מסע הטרנספורמציה...", en: "Building the transformation journey..." },
  { he: "יוצר את ימי ה-Flow...", en: "Creating the Flow days..." },
  { he: "מוסיף משימות ותרגילים...", en: "Adding tasks and exercises..." },
  { he: "משלים את החוויה...", en: "Completing the experience..." },
];

const ContentUploadSection = ({ journeyData, onBack }: ContentUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsCancelling(true);
    stopIntervals();
    setIsGenerating(false);
    setProgress(0);
    setProgressMessage("");
    setMessageIndex(0);
    setIsCancelling(false);
    toast({
      title: i18n.language === 'he' ? "הפעולה בוטלה" : "Operation cancelled",
      description: i18n.language === 'he' ? "יצירת ה-Flow בוטלה" : "Flow generation was cancelled",
    });
  };

  useEffect(() => {
    return () => {
      stopIntervals();
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    );
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

  const hasContent = textContent.trim().length > 0 || uploadedFiles.length > 0;

  const handleGenerateJourney = async () => {
    if (!hasContent) {
      toast({
        title: t('journeyCreate.noContentProvided'),
        description: t('journeyCreate.noContentDescription'),
        variant: "destructive",
      });
      return;
    }

    isCancelledRef.current = false;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsGenerating(true);
    setProgress(0);
    setProgressMessage(t('journeyCreate.starting'));
    setMessageIndex(0);
    
    stopIntervals();
    messageIntervalRef.current = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);
    
    try {
      let content = textContent;
      
      if (uploadedFiles.length > 0) {
        setProgressMessage(t('journeyCreate.readingFiles'));
        const parsed = await fileApi.parseFiles(uploadedFiles, signal);
        if (isCancelledRef.current) return;
        content = content + "\n\n" + parsed.text;
      }
      
      content = content.trim();
      
      if (!content) {
        toast({
          title: t('journeyCreate.couldNotExtractText'),
          description: t('journeyCreate.couldNotExtractDescription'),
          variant: "destructive",
        });
        setIsGenerating(false);
        stopIntervals();
        return;
      }

      if (isCancelledRef.current) return;

      setProgressMessage(t('journeyCreate.creatingFlow'));
      setProgress(2);

      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration?.[0] || 7,
        status: "draft",
        description: journeyData.additionalNotes || "",
        language: journeyData.language || "en",
        clientChallenges: journeyData.clientChallenges || "",
        profession: journeyData.profession || "",
        tone: journeyData.tone || "",
      }, signal);

      if (isCancelledRef.current) return;

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      await journeyApi.generateContentWithProgress(journey.id, content, (prog, msg) => {
        if (!isCancelledRef.current) {
          setProgress(prog);
          setProgressMessage(msg);
        }
      }, signal);

      if (isCancelledRef.current) return;

      stopIntervals();
      setLocation(`/journey/${journey.id}/edit`);
    } catch (error: any) {
      if (isCancelledRef.current || error?.name === 'AbortError') return;
      console.error("[ContentUpload] Error:", error);
      stopIntervals();
      toast({
        title: t('error'),
        description: t('journeyCreate.generationError'),
        variant: "destructive",
      });
    } finally {
      abortControllerRef.current = null;
      if (!isCancelledRef.current) {
        setIsGenerating(false);
        setProgress(0);
        setProgressMessage("");
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return "📄";
    if (file.type.includes('word')) return "📝";
    return "📃";
  };

  const currentLoadingMessage = i18n.language === 'he' 
    ? loadingMessages[messageIndex].he 
    : loadingMessages[messageIndex].en;

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-[#0f0f23] z-50 flex items-center justify-center">
        <div className="max-w-lg w-full px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-8"
          >
            <div className="w-32 h-32 mx-auto relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-4 rounded-full bg-gradient-to-r from-violet-600 to-violet-500"
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Wand2 className="w-12 h-12 text-violet-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-4"
          >
            {t('journeyCreate.generatingWithAI')}
          </motion.h2>

          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/60 text-lg mb-8"
            >
              {currentLoadingMessage}
            </motion.p>
          </AnimatePresence>

          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-4">
            <motion.div
              className="absolute inset-y-0 start-0 bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-white/40">{progressMessage}</span>
            <span className="text-violet-400 font-bold">{progress}%</span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-500"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isCancelling}
              className="text-white/50 hover:text-white hover:bg-white/10"
              data-testid="button-cancel-generation"
            >
              <X className="w-4 h-4 me-2" />
              {t('journeyCreate.cancelGeneration')}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-600/20 to-violet-500/10 border border-violet-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">{t('journeyCreate.shareContentTitle')}</h3>
            <p className="text-white/60 mb-4">
              {t('journeyCreate.shareContentDescription')}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-white/40">{t('journeyCreate.flowLabel')}:</span>{" "}
                <span className="text-white font-medium">{journeyData.journeyName}</span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-white/40">{t('journeyCreate.durationLabel')}:</span>{" "}
                <span className="text-white font-medium">{t('journeyCreate.durationDays', { count: journeyData.duration?.[0] })}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 h-auto">
          <TabsTrigger 
            value="upload" 
            className="flex items-center gap-2 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg py-3 transition-all" 
            data-testid="tab-upload"
          >
            <CloudUpload className="w-4 h-4" />
            {t('journeyCreate.uploadFiles')}
          </TabsTrigger>
          <TabsTrigger 
            value="paste" 
            className="flex items-center gap-2 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-violet-500 data-[state=active]:text-white rounded-lg py-3 transition-all" 
            data-testid="tab-paste"
          >
            <Copy className="w-4 h-4" />
            {t('journeyCreate.pasteContent')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? "border-violet-500 bg-violet-500/10 scale-[1.02]" 
                : "border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-white/10"
            }`}
          >
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt"
              data-testid="input-file-upload"
            />
            
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-violet-500/30" : "bg-white/10"
              }`}>
                <CloudUpload className={`w-10 h-10 transition-colors ${
                  isDragging ? "text-violet-400" : "text-white/40"
                }`} />
              </div>
              <div>
                <p className="text-xl font-medium text-white mb-2">
                  {isDragging ? t('journeyCreate.dropFilesNow') || "Drop files here" : t('journeyCreate.dropFilesHere')}
                </p>
                <p className="text-sm text-white/50">
                  {t('journeyCreate.supportsFormats')}
                </p>
              </div>
            </motion.div>

            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 border-2 border-violet-500 rounded-2xl pointer-events-none"
              />
            )}
          </motion.div>

          <p className="text-xs text-white/40 text-center">
            <AlertCircle className="w-3 h-3 inline-block me-1" />
            {t('journeyCreate.textExtractionNote')}
          </p>

          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  {t('journeyCreate.uploadedFiles')} ({uploadedFiles.length})
                </h4>
                {uploadedFiles.map((file, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-colors" 
                    data-testid={`file-item-${index}`}
                  >
                    <span className="text-2xl">{getFileIcon(file)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <p className="text-white/40 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-white/40 hover:text-red-400"
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-200/80">
              <strong className="text-amber-200">{t('journeyCreate.contentLimits')}</strong> {t('journeyCreate.contentLimitsFiles')}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="paste" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Textarea
              placeholder={t('journeyCreate.pasteContentPlaceholder')}
              value={textContent}
              onChange={(e) => {
                if (e.target.value.length <= 50000) {
                  setTextContent(e.target.value);
                }
              }}
              className="min-h-[300px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-2xl p-5 text-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              data-testid="textarea-content"
            />
            <div className="mt-3 flex justify-between items-center">
              <span className={`text-sm ${textContent.length > 45000 ? 'text-amber-400 font-medium' : 'text-white/40'}`}>
                {textContent.length.toLocaleString()} / 50,000 {t('journeyCreate.characters')}
              </span>
              {textContent.length > 45000 && (
                <span className="text-sm text-amber-400">{t('journeyCreate.approachingLimit')}</span>
              )}
            </div>
          </motion.div>

          <div className="flex items-start gap-3 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-200/80">
              <strong className="text-amber-200">{t('journeyCreate.contentLimitChars')}</strong> {t('journeyCreate.contentLimitCharsValue')}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button 
          variant="ghost" 
          size="lg" 
          onClick={onBack} 
          disabled={isGenerating} 
          className="text-white/60 hover:text-white hover:bg-white/10 h-12 px-6 rounded-xl" 
          data-testid="button-back"
        >
          {t('journeyCreate.backToIntent')}
        </Button>
        <Button 
          className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 h-12 px-8 rounded-xl font-medium shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50 disabled:shadow-none" 
          size="lg"
          onClick={handleGenerateJourney}
          disabled={isGenerating || !hasContent}
          data-testid="button-generate-journey"
        >
          <Sparkles className="w-4 h-4 me-2" />
          {t('journeyCreate.generateFlowWithAI')}
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;
