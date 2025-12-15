import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi } from "@/lib/api";

interface ContentUploadSectionProps {
  journeyData: any;
  onBack?: () => void;
}

const ContentUploadSection = ({ journeyData, onBack }: ContentUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} file(s) added to your journey content.`,
    });
  };

  const getContentForGeneration = async (): Promise<string> => {
    let content = textContent;
    
    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const text = await file.text();
          content += "\n\n" + text;
        }
      }
    }
    
    return content.trim();
  };

  const hasTextContent = textContent.trim().length > 0;
  const hasTextFiles = uploadedFiles.some(f => f.type === "text/plain" || f.name.endsWith(".txt"));
  const hasReadableContent = hasTextContent || hasTextFiles;

  const handleGenerateJourney = async () => {
    const content = await getContentForGeneration();
    
    if (!content) {
      const hasPdfFiles = uploadedFiles.some(f => f.name.endsWith(".pdf"));
      if (hasPdfFiles) {
        toast({
          title: "PDF files cannot be read directly",
          description: "Please copy the text from your PDF and paste it in the 'Paste Content' tab.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No content provided",
          description: "Please paste your content or upload text files (.txt) before generating.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsGenerating(true);
    try {
      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration?.[0] || 7,
        status: "draft",
        description: journeyData.additionalNotes || "",
      });

      await journeyApi.generateContent(journey.id, content);

      toast({
        title: "Journey generated!",
        description: "AI has created your journey content based on your materials.",
      });

      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate journey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getFileIcon = () => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Share Your Content & Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To create a personalized digital journey for your clients, we need your unique content and methodology. 
            Share your teachings, exercises, meditations, or any materials you use in your practice.
          </p>
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <p><strong>Journey:</strong> {journeyData.journeyName}</p>
            <p><strong>Duration:</strong> {journeyData.duration?.[0]} days</p>
            <p><strong>For:</strong> {journeyData.targetAudience}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2" data-testid="tab-paste">
            <FileText className="w-4 h-4" />
            Paste Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Text Files
              </CardTitle>
              <CardDescription>
                Upload .txt files containing your teachings, methods, or course materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> For PDF or Word documents, copy the text and use the "Paste Content" tab instead.
                </div>
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".txt"
                  data-testid="input-file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Drop files here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports .txt text files
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md" data-testid={`file-item-${index}`}>
                      {getFileIcon()}
                      <span className="flex-1 text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Paste Your Existing Content
              </CardTitle>
              <CardDescription>
                Copy and paste text content, meditations, questions, or any written material you've already prepared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Content limit:</strong> Up to 50,000 characters
                </div>
              </div>
              
              <Textarea
                placeholder="Paste your content here... This could include meditations, reflection questions, instructions, or any other text-based content for your journey."
                value={textContent}
                onChange={(e) => {
                  if (e.target.value.length <= 50000) {
                    setTextContent(e.target.value);
                  }
                }}
                className="min-h-[300px] resize-none"
                data-testid="textarea-content"
              />
              <div className="mt-2 flex justify-between items-center">
                <span className={`text-sm ${textContent.length > 45000 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                  {textContent.length.toLocaleString()} / 50,000 characters
                </span>
                {textContent.length > 45000 && (
                  <span className="text-sm text-amber-600">Approaching limit</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" size="lg" onClick={onBack} data-testid="button-back">
          Back to Intent
        </Button>
        <Button 
          className="bg-primary hover:bg-primary/90 shadow-spiritual" 
          size="lg"
          onClick={handleGenerateJourney}
          disabled={isGenerating || !hasReadableContent}
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
              Generate Journey with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;
