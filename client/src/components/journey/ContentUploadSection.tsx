import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Video, Music, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { journeyApi, stepApi } from "@/lib/api";

interface ContentUploadSectionProps {
  journeyData: any;
  onBack?: () => void;
}

const ContentUploadSection = ({ journeyData, onBack }: ContentUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateJourney = async () => {
    setIsCreating(true);
    try {
      const journey = await journeyApi.create({
        name: journeyData.journeyName,
        goal: journeyData.mainGoal,
        audience: journeyData.targetAudience,
        duration: journeyData.duration?.[0] || 7,
        status: "draft",
        description: journeyData.additionalNotes || "",
      });

      const duration = journeyData.duration?.[0] || 7;
      for (let i = 1; i <= duration; i++) {
        await stepApi.create(journey.id, {
          dayNumber: i,
          title: `Day ${i}`,
          description: "",
        });
      }

      toast({
        title: "Journey created!",
        description: "Your journey has been created successfully.",
      });

      setLocation(`/journey/${journey.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (file.type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Journey Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {journeyData.journeyName}</p>
          <p><strong>Duration:</strong> {journeyData.duration?.[0]} days</p>
          <p><strong>Audience:</strong> {journeyData.targetAudience}</p>
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
                Upload Your Content Files
              </CardTitle>
              <CardDescription>
                Upload videos, audio files, PDFs, images, or any content you want to include in your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt"
                  data-testid="input-file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Drop files here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports videos, audio, images, PDFs, and documents
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
                      {getFileIcon(file)}
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
            <CardContent>
              <Textarea
                placeholder="Paste your content here... This could include meditations, reflection questions, instructions, or any other text-based content for your journey."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-[300px] resize-none"
                data-testid="textarea-content"
              />
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  {textContent.length} characters
                </span>
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
          onClick={handleCreateJourney}
          disabled={isCreating}
          data-testid="button-create-journey"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Journey & Continue to Editor"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;
