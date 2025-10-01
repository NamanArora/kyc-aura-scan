import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, VideoOff, Mic, MicOff, ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Live = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

  const instructions = [
    "Blink slowly for 5 seconds",
    "Turn your head to the left",
    "Turn your head to the right",
    "Look straight at the camera",
    "Smile naturally"
  ];

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!stream) return;

    const interval = setInterval(() => {
      setCurrentInstructionIndex((prevIndex) =>
        (prevIndex + 1) % instructions.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [stream, instructions.length]);

  const startCamera = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });

      setStream(mediaStream);
      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError("Unable to access camera and microphone. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoOn(false);
    setIsAudioOn(false);
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const startAnalysis = () => {
    if (stream) {
      const sessionId = Date.now().toString();
      // Store session data in localStorage for the demo
      localStorage.setItem(`kyc-session-${sessionId}`, JSON.stringify({
        type: 'live',
        hasVideo: isVideoOn,
        hasAudio: isAudioOn,
        timestamp: new Date().toISOString()
      }));
      
      // Stop camera before navigating
      stopCamera();
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
            <h1 className="text-3xl font-bold">Live Video KYC</h1>
            <p className="text-muted-foreground">Real-time verification using your camera</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Camera Preview */}
          <Card className="border-card-border bg-gradient-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Camera Preview
                {stream && (
                  <Badge variant="outline" className="ml-auto text-success border-success">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Position yourself clearly in the frame with good lighting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stream && (
                <div className="mb-4 p-4 bg-primary/10 border-2 border-primary rounded-lg text-center">
                  <p className="text-lg font-semibold text-primary">
                    {instructions[currentInstructionIndex]}
                  </p>
                </div>
              )}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {stream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Camera Not Active</h3>
                        <p className="text-sm text-muted-foreground">
                          Click "Start Camera" to begin
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Camera overlay guide */}
                {stream && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-64 h-80 border-2 border-primary/30 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4 mt-6">
                {!stream ? (
                  <Button 
                    onClick={startCamera} 
                    disabled={isLoading}
                    size="lg"
                    className="px-8"
                  >
                    {isLoading ? "Starting..." : "Start Camera"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={isVideoOn ? "default" : "destructive"}
                      onClick={toggleVideo}
                      size="lg"
                    >
                      {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant={isAudioOn ? "default" : "destructive"}
                      onClick={toggleAudio}
                      size="lg"
                    >
                      {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      size="lg"
                    >
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-lg">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Requirements */}
          <Card className="border-card-border bg-gradient-surface">
            <CardHeader>
              <CardTitle>Setup Requirements</CardTitle>
              <CardDescription>
                Ensure your environment is optimized for accurate verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-success">✓ Lighting</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure even lighting on your face, avoid backlighting
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-success">✓ Position</h3>
                  <p className="text-sm text-muted-foreground">
                    Center your face in the oval guide, maintain 18-24 inches distance
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-success">✓ Background</h3>
                  <p className="text-sm text-muted-foreground">
                    Use a plain, contrasting background for better detection
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-success">✓ Audio</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure microphone is working for speech verification
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Analysis */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={startAnalysis}
              disabled={!stream || !isVideoOn}
              className="px-12 py-6 text-lg font-medium shadow-glow disabled:shadow-none"
            >
              Start Live KYC Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Live;