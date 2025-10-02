import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileVideo, Image, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchVideoList } from "@/services/checks";

const Upload = () => {
  const navigate = useNavigate();
  const idInputRef = useRef<HTMLInputElement>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [availableVideos, setAvailableVideos] = useState<string[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Fetch available videos on mount
  useEffect(() => {
    const loadVideos = async () => {
      setIsLoadingVideos(true);
      const videos = await fetchVideoList();
      setAvailableVideos(videos);
      setIsLoadingVideos(false);
    };
    loadVideos();
  }, []);

  const handleDropdownSelect = (videoFilename: string) => {
    setSelectedVideo(videoFilename);
  };

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIdFile(files[0]);
    }
  };

  const startAnalysis = () => {
    if (selectedVideo) {
      const sessionId = Date.now().toString();

      // Construct video path
      const videoPath = `/public/video/${selectedVideo}`;

      // Store session data in localStorage matching Live page format
      localStorage.setItem(`kyc-session-${sessionId}`, JSON.stringify({
        type: 'upload',
        videoPath: videoPath,
        videoFilename: selectedVideo,
        idFile: idFile?.name,
        timestamp: new Date().toISOString()
      }));
      navigate(`/dashboard/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Upload Video KYC</h1>
            <p className="text-muted-foreground">Upload your video and ID documents for verification</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Video Upload */}
          <Card className="border-card-border bg-gradient-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary" />
                Video File
                <Badge variant="destructive" className="ml-auto">Required</Badge>
              </CardTitle>
              <CardDescription>
                Upload a clear video of yourself for KYC verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Dropdown to select video */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Select a video for KYC verification
                </label>
                <Select
                  value={selectedVideo || ""}
                  onValueChange={handleDropdownSelect}
                  disabled={isLoadingVideos}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingVideos ? "Loading videos..." : "Choose a video"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVideos.map((video) => (
                      <SelectItem key={video} value={video}>
                        {video}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableVideos.length === 0 && !isLoadingVideos && (
                  <p className="text-xs text-warning mt-2">
                    No videos available. Please use Live KYC or record a video first.
                  </p>
                )}
              </div>

              {/* Video preview */}
              {selectedVideo && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full object-contain"
                      src={`http://localhost:8000/public/video/${selectedVideo}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="text-xs text-success text-center">
                    ✓ Selected: {selectedVideo}
                  </p>
                </div>
              )}

              {!selectedVideo && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                    <FileVideo className="w-8 h-8 text-primary" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium">No video selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a video from the dropdown above
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ID Document Upload */}
          <Card className="border-card-border bg-gradient-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-warning" />
                ID Document
                <Badge variant="secondary" className="ml-auto">Optional</Badge>
              </CardTitle>
              <CardDescription>
                Upload a photo of your government-issued ID for face matching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                idFile 
                  ? 'border-success bg-success/5' 
                  : 'border-border hover:border-warning/50'
              }`}>
                {idFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-success/10">
                      <Image className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <h3 className="font-medium text-success">{idFile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(idFile.size)} • {idFile.type}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => idInputRef.current?.click()}>
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-warning/10">
                      <Image className="w-8 h-8 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-medium">Upload ID Document</h3>
                      <p className="text-sm text-muted-foreground">Driver's license, passport, or national ID</p>
                    </div>
                    <Button variant="outline" onClick={() => idInputRef.current?.click()}>
                      Select Image
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={idInputRef}
                type="file"
                accept="image/*"
                onChange={handleIdSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: JPG, PNG, PDF • Max size: 10MB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Button */}
        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            onClick={startAnalysis}
            disabled={!selectedVideo}
            className="px-12 py-6 text-lg font-medium shadow-glow disabled:shadow-none"
          >
            Start KYC Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upload;