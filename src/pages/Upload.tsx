import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileVideo, Image, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Upload = () => {
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      setVideoFile(files[0]);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
    }
  };

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIdFile(files[0]);
    }
  };

  const startAnalysis = () => {
    if (videoFile) {
      const sessionId = Date.now().toString();
      // Store session data in localStorage for the demo
      localStorage.setItem(`kyc-session-${sessionId}`, JSON.stringify({
        type: 'upload',
        videoFile: videoFile.name,
        idFile: idFile?.name,
        timestamp: new Date().toISOString()
      }));
      navigate(`/dashboard/${sessionId}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : videoFile 
                      ? 'border-success bg-success/5' 
                      : 'border-border hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleVideoDrop}
              >
                {videoFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-success/10">
                      <Play className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <h3 className="font-medium text-success">{videoFile.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(videoFile.size)} • {videoFile.type}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => videoInputRef.current?.click()}>
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                      <UploadIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Drop your video here</h3>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <Button onClick={() => videoInputRef.current?.click()}>
                      Select Video File
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: MP4, MOV, AVI • Max size: 100MB
              </p>
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
            disabled={!videoFile}
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