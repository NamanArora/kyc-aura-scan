import { Shield, Upload, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Shield className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SecureKYC Pro
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced deepfake-resistant Video KYC solution with real-time biometric verification
            and comprehensive fraud detection.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 border-card-border bg-gradient-surface cursor-pointer"
                onClick={() => navigate('/upload')}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Upload Video KYC</CardTitle>
              <CardDescription className="text-base">
                Upload a pre-recorded video file along with ID documentation for verification analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" className="w-full group-hover:shadow-glow transition-all">
                Choose File & Start Analysis
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Supports MP4, MOV, AVI • Max 100MB
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-card-border bg-gradient-surface cursor-pointer"
                onClick={() => navigate('/live')}>
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 rounded-full bg-success/10 group-hover:bg-success/15 transition-colors">
                <Video className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Live Video KYC</CardTitle>
              <CardDescription className="text-base">
                Real-time verification using your device camera with live liveness detection
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" variant="outline" className="w-full border-success text-success hover:bg-success hover:text-success-foreground group-hover:shadow-glow transition-all">
                Start Live Session
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Camera & microphone required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-center mb-8">Advanced Security Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Active Liveness</h3>
              <p className="text-sm text-muted-foreground">Real-time challenge-response verification</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-medium mb-1">Deepfake Detection</h3>
              <p className="text-sm text-muted-foreground">Advanced AI-powered forensic analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-warning/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-medium mb-1">3D Face Analysis</h3>
              <p className="text-sm text-muted-foreground">Head pose and micro-expression tracking</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-danger/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-danger" />
              </div>
              <h3 className="font-medium mb-1">Audio-Visual Sync</h3>
              <p className="text-sm text-muted-foreground">Lip movement and speech correlation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;