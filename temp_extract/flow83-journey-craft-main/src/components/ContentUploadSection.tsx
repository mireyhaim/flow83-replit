import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Wand2, Edit3, Video, Music, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentUploadSectionProps {
  journeyData: any;
}

const ContentUploadSection = ({ journeyData }: ContentUploadSectionProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} file(s) added to your journey content.`,
    });
  };

  const handleAIGenerate = () => {
    toast({
      title: "AI Journey Composer activated",
      description: "We'll help you create structured content based on your intentions.",
    });
  };

  const handleAIAssist = () => {
    toast({
      title: "AI Content Assistant activated",
      description: "We'll help you refine and enhance your existing content.",
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (file.type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8">
      {/* Journey Summary */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Journey Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {journeyData.journeyName}</p>
          <p><strong>Duration:</strong> {journeyData.duration?.[0]} days</p>
          <p><strong>Audience:</strong> {journeyData.targetAudience}</p>
          <p><strong>Has Content:</strong> {journeyData.hasContent}</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Paste Content
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI Assistance
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
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
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
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">
                  {textContent.length} characters
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleAIAssist}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  AI Help with Editing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  AI Journey Composer
                </CardTitle>
                <CardDescription>
                  Don't have content yet? Let AI help you create a complete journey structure with guided content based on your intentions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="spiritual" 
                  onClick={handleAIGenerate}
                  className="w-full"
                >
                  Generate Journey Content with AI
                </Button>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-accent" />
                  AI Content Enhancer
                </CardTitle>
                <CardDescription>
                  Have some content but need help with editing, structuring, or improving the flow and language?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handleAIAssist}
                  className="w-full border-accent/50 hover:bg-accent/10"
                >
                  Enhance My Existing Content
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations Based on Your Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted/50 rounded-md">
                  <h4 className="font-medium mb-2">Suggested Day Structure:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Opening intention/meditation (5-10 min)</li>
                    <li>• Core content/teaching (15-20 min)</li>
                    <li>• Reflection questions</li>
                    <li>• Closing practice or affirmation</li>
                  </ul>
                </div>
                <div className="p-4 bg-muted/50 rounded-md">
                  <h4 className="font-medium mb-2">Recommended Elements:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Welcome video introduction</li>
                    <li>• Daily guided meditations</li>
                    <li>• Journaling prompts</li>
                    <li>• Progress check-ins</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" size="lg">
          Back to Intent
        </Button>
        <Button variant="spiritual" size="lg">
          Preview & Finalize Journey
        </Button>
      </div>
    </div>
  );
};

export default ContentUploadSection;