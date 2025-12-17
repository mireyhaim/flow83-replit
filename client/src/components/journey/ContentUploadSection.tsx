import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, AlertCircle, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, fileApi } from "@/lib/api";

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles(uploadedFiles.filter((_, index) => index !== indexToRemove));
  };

  const hasContent = textContent.trim().length > 0 || uploadedFiles.length > 0;

  const handleGenerateJourney = async () => {
    if (!hasContent) {
      toast({
        title: "No content provided",
        description: "Please paste your content or upload files before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage("Starting...");
    
    try {
      let content = textContent;
      
      if (uploadedFiles.length > 0) {
        setProgressMessage("Reading files...");
        const parsed = await fileApi.parseFiles(uploadedFiles);
        content = content + "\n\n" + parsed.text;
      }
      
      content = content.trim();
      
      if (!content) {
        toast({
          title: "Could not extract text",
          description: "The files could not be read. Please try pasting the content instead.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      setProgressMessage("Creating flow...");
      setProgress(2);

      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration?.[0] || 7,
        status: "draft",
        description: journeyData.additionalNotes || "",
      });

      await journeyApi.generateContentWithProgress(journey.id, content, (prog, msg) => {
        setProgress(prog);
        setProgressMessage(msg);
      });

      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate flow. Please try again.",
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
      <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Share Your Content & Method</h3>
        <p className="text-white/60 mb-4">
          To create a personalized digital flow for your clients, we need your unique content and methodology. 
          Share your teachings, exercises, meditations, or any materials you use in your practice.
        </p>
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <p className="text-white"><strong className="text-white/80">Flow:</strong> {journeyData.journeyName}</p>
          <p className="text-white"><strong className="text-white/80">Duration:</strong> {journeyData.duration?.[0]} days</p>
          <p className="text-white"><strong className="text-white/80">For:</strong> {journeyData.targetAudience}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="upload" className="flex items-center gap-2 text-white/60 data-[state=active]:bg-violet-600 data-[state=active]:text-white" data-testid="tab-upload">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2 text-white/60 data-[state=active]:bg-violet-600 data-[state=active]:text-white" data-testid="tab-paste">
            <FileText className="w-4 h-4" />
            Paste Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Upload className="w-5 h-5 text-violet-400" />
                Upload Your Documents
              </h4>
              <p className="text-white/50 mt-1">
                Upload PDF or text files containing your teachings, methods, or course materials.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <strong>Content limits:</strong> Up to 10 files, max 50MB per file
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
                      <p className="text-lg font-medium text-white">Drop files here or click to browse</p>
                      <p className="text-sm text-white/50">
                        Supports PDF, Word (DOC/DOCX), and text files
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Uploaded Files:</h4>
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
                Paste Your Existing Content
              </h4>
              <p className="text-white/50 mt-1">
                Copy and paste text content, meditations, questions, or any written material you've already prepared.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-950/30 border border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                  <strong>Content limit:</strong> Up to 50,000 characters
                </div>
              </div>
              
              <Textarea
                placeholder="Paste your content here... This could include meditations, reflection questions, instructions, or any other text-based content for your flow."
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
                  {textContent.length.toLocaleString()} / 50,000 characters
                </span>
                {textContent.length > 45000 && (
                  <span className="text-sm text-amber-400">Approaching limit</span>
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
          Back to Intent
        </Button>
        <Button 
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90" 
          size="lg"
          onClick={handleGenerateJourney}
          disabled={isGenerating || !hasContent}
          data-testid="button-generate-journey"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Flow with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;
