import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, AlertCircle, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, fileApi } from "@/lib/api";
import { useTranslation } from "react-i18next";

interface ContentUploadSectionProps {
  journeyData: any;
  onBack?: () => void;
}

const ContentUploadSection = ({ journeyData, onBack }: ContentUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

  const hasContent = textContent.trim().length > 0 || uploadedFiles.length > 0;

  const handleGenerateJourney = async () => {
    console.log("[ContentUpload] Starting handleGenerateJourney");
    console.log("[ContentUpload] hasContent:", hasContent);
    console.log("[ContentUpload] uploadedFiles:", uploadedFiles.length);
    console.log("[ContentUpload] textContent length:", textContent.length);
    
    if (!hasContent) {
      toast({
        title: t('journeyCreate.noContentProvided'),
        description: t('journeyCreate.noContentDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage(t('journeyCreate.starting'));
    
    try {
      let content = textContent;
      
      if (uploadedFiles.length > 0) {
        console.log("[ContentUpload] Parsing files...");
        setProgressMessage(t('journeyCreate.readingFiles'));
        const parsed = await fileApi.parseFiles(uploadedFiles);
        console.log("[ContentUpload] Parsed text length:", parsed.text?.length || 0);
        content = content + "\n\n" + parsed.text;
      }
      
      content = content.trim();
      console.log("[ContentUpload] Final content length:", content.length);
      
      if (!content) {
        console.log("[ContentUpload] No content after parsing!");
        toast({
          title: t('journeyCreate.couldNotExtractText'),
          description: t('journeyCreate.couldNotExtractDescription'),
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setProgressMessage(t('journeyCreate.creatingFlow'));
      setProgress(2);

      console.log("[ContentUpload] Creating journey...");
      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration?.[0] || 7,
        status: "draft",
        description: journeyData.additionalNotes || "",
        language: journeyData.language || "en",
      });
      console.log("[ContentUpload] Journey created:", journey.id);

      // Refresh user data to get updated trial status (trial starts when first journey is created)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      console.log("[ContentUpload] Starting AI generation...");
      await journeyApi.generateContentWithProgress(journey.id, content, (prog, msg) => {
        console.log("[ContentUpload] Progress:", prog, msg);
        setProgress(prog);
        setProgressMessage(msg);
      });
      console.log("[ContentUpload] AI generation complete!");

      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      console.error("[ContentUpload] Error:", error);
      toast({
        title: t('error'),
        description: t('journeyCreate.generationError'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage("");
    }
  };

  const getFileIcon = () => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      <div className="bg-violet-600/20 border border-violet-500/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">{t('journeyCreate.shareContentTitle')}</h3>
        <p className="text-white/60 mb-4">
          {t('journeyCreate.shareContentDescription')}
        </p>
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <p className="text-white"><strong className="text-white/80">{t('journeyCreate.flowLabel')}:</strong> {journeyData.journeyName}</p>
          <p className="text-white"><strong className="text-white/80">{t('journeyCreate.durationLabel')}:</strong> {t('journeyCreate.durationDays', { count: journeyData.duration?.[0] })}</p>
          <p className="text-white"><strong className="text-white/80">{t('journeyCreate.forLabel')}:</strong> {journeyData.targetAudience}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="upload" className="flex items-center gap-2 text-white/60 data-[state=active]:bg-violet-600 data-[state=active]:text-white" data-testid="tab-upload">
            <Upload className="w-4 h-4" />
            {t('journeyCreate.uploadFiles')}
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2 text-white/60 data-[state=active]:bg-violet-600 data-[state=active]:text-white" data-testid="tab-paste">
            <FileText className="w-4 h-4" />
            {t('journeyCreate.pasteContent')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Upload className="w-5 h-5 text-violet-400" />
                {t('journeyCreate.uploadDocuments')}
              </h4>
              <p className="text-white/50 mt-1">
                {t('journeyCreate.uploadDocumentsDescription')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <strong>{t('journeyCreate.contentLimits')}</strong> {t('journeyCreate.contentLimitsFiles')}
                </div>
              </div>
              
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-violet-500/50 transition-colors">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt"
                  data-testid="input-file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-white/40" />
                    <div>
                      <p className="text-lg font-medium text-white">{t('journeyCreate.dropFilesHere')}</p>
                      <p className="text-sm text-white/50">
                        {t('journeyCreate.supportsFormats')}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">{t('journeyCreate.uploadedFiles')}</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-md" data-testid={`file-item-${index}`}>
                      {getFileIcon()}
                      <span className="flex-1 text-sm text-white">{file.name}</span>
                      <span className="text-xs text-white/50">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-red-400"
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="paste" className="space-y-6">
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FileText className="w-5 h-5 text-violet-400" />
                {t('journeyCreate.pasteExistingContent')}
              </h4>
              <p className="text-white/50 mt-1">
                {t('journeyCreate.pasteExistingDescription')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <strong>{t('journeyCreate.contentLimitChars')}</strong> {t('journeyCreate.contentLimitCharsValue')}
                </div>
              </div>
              
              <Textarea
                placeholder={t('journeyCreate.pasteContentPlaceholder')}
                value={textContent}
                onChange={(e) => {
                  if (e.target.value.length <= 50000) {
                    setTextContent(e.target.value);
                  }
                }}
                className="min-h-[300px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="textarea-content"
              />
              <div className="mt-2 flex justify-between items-center">
                <span className={`text-sm ${textContent.length > 45000 ? 'text-amber-400 font-medium' : 'text-white/50'}`}>
                  {textContent.length.toLocaleString()} / 50,000 {t('journeyCreate.characters')}
                </span>
                {textContent.length > 45000 && (
                  <span className="text-sm text-amber-400">{t('journeyCreate.approachingLimit')}</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {isGenerating && (
        <div className="border border-violet-500/30 bg-violet-600/10 rounded-xl p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">{progressMessage}</span>
              <span className="font-medium text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isGenerating} className="border-white/20 text-white hover:bg-white/10" data-testid="button-back">
          {t('journeyCreate.backToIntent')}
        </Button>
        <Button 
          className="bg-violet-600 hover:bg-violet-700" 
          size="lg"
          onClick={handleGenerateJourney}
          disabled={isGenerating || !hasContent}
          data-testid="button-generate-journey"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
              {t('journeyCreate.generatingWithAI')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 me-2" />
              {t('journeyCreate.generateFlowWithAI')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;
