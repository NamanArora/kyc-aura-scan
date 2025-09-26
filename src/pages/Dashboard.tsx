import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RotateCcw, Settings, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockEngine, DEMO_SCENARIOS, KYCSession, DemoScenario } from "@/utils/mockEngine";
import { ControlPanel } from "@/components/ControlPanel";
import { ScoreChart } from "@/components/ScoreChart";
import { PromptCard } from "@/components/PromptCard";

const Dashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<KYCSession | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    // Check if session exists in localStorage
    const storedSession = localStorage.getItem(`kyc-session-${id}`);
    if (!storedSession) {
      navigate('/');
      return;
    }

    // Create or get session
    let currentSession = mockEngine.getSession(id);
    if (!currentSession) {
      const sessionData = JSON.parse(storedSession);
      currentSession = mockEngine.createSession(id, sessionData.type, selectedScenario);
    }

    setSession(currentSession);
  }, [id, navigate, selectedScenario]);

  const startAnalysis = () => {
    if (!session) return;
    
    setIsProcessing(true);
    mockEngine.startProcessing(session.id, (updatedSession) => {
      setSession({ ...updatedSession });
      if (updatedSession.status === 'completed') {
        setIsProcessing(false);
      }
    });
  };

  const resetSession = () => {
    if (!session) return;
    
    mockEngine.stopSession(session.id);
    const sessionData = JSON.parse(localStorage.getItem(`kyc-session-${session.id}`) || '{}');
    const newSession = mockEngine.createSession(session.id, sessionData.type, selectedScenario);
    setSession(newSession);
    setIsProcessing(false);
  };

  const downloadReport = async () => {
    if (!session) return;
    
    try {
      const reportString = mockEngine.exportReport(session.id);
      const report = JSON.parse(reportString);
      const hash = await mockEngine.generateReportHash(reportString);
      
      const finalReport = {
        ...report,
        integrity: {
          hash,
          algorithm: 'SHA-256'
        }
      };

      const blob = new Blob([JSON.stringify(finalReport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kyc-report-${session.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (decision: string) => {
    switch (decision) {
      case 'PASS': return 'text-success';
      case 'RETRY': return 'text-warning';
      case 'FAIL': return 'text-danger';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'PASS': return 'default';
      case 'RETRY': return 'secondary';
      case 'FAIL': return 'destructive';
      default: return 'outline';
    }
  };

  if (!session) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested KYC session could not be found.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">KYC Analysis Dashboard</h1>
              <p className="text-muted-foreground">
                Session {session.id} • {session.type === 'live' ? 'Live Camera' : 'Video Upload'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowControls(!showControls)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Demo Controls
            </Button>
            <Button
              variant="outline"
              onClick={resetSession}
              disabled={isProcessing}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={session.status === 'completed' ? downloadReport : startAnalysis}
              disabled={isProcessing && session.status !== 'completed'}
              className="gap-2"
            >
              {session.status === 'completed' ? (
                <>
                  <Download className="w-4 h-4" />
                  Download Report
                </>
              ) : (
                <>
                  {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 H-4" />}
                  {isProcessing ? 'Processing...' : 'Start Analysis'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Demo Controls */}
        {showControls && (
          <Card className="mb-6 border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">Demo Control Panel</CardTitle>
              <CardDescription>
                Adjust scenario and check parameters for demonstration purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ControlPanel
                selectedScenario={selectedScenario}
                onScenarioChange={setSelectedScenario}
                session={session}
                onSessionUpdate={setSession}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Prompt & Status */}
          <div className="space-y-6">
            {/* Active Prompt */}
            <PromptCard session={session} />

            {/* Overall Status */}
            <Card className="border-card-border bg-gradient-surface">
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getStatusColor(session.decision)}`}>
                    {session.finalScore}
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={getStatusBadgeVariant(session.decision)} className="text-lg px-4 py-2">
                    {session.decision}
                  </Badge>
                </div>

                {session.reasoning.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <h4 className="font-medium">Decision Reasoning</h4>
                    {session.reasoning.map((reason, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {reason}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Checks Grid */}
          <div className="space-y-6">
            <Card className="border-card-border bg-gradient-surface">
              <CardHeader>
                <CardTitle>Security Checks</CardTitle>
                <CardDescription>
                  Real-time verification across 7 security dimensions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.checks.map((check) => (
                  <div key={check.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{check.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">
                          {check.score}/{check.maxScore}
                        </span>
                        <Badge 
                          variant={check.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {check.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={check.score} 
                      max={check.maxScore}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Charts & Logs */}
          <div className="space-y-6">
            {/* Score Charts */}
            <ScoreChart session={session} />

            {/* Event Logs */}
            <Card className="border-card-border bg-gradient-surface">
              <CardHeader>
                <CardTitle>Event Log</CardTitle>
                <CardDescription>
                  Real-time analysis events and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {session.events.map((event, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`min-w-[60px] text-xs font-medium ${
                          event.type === 'success' ? 'text-success' :
                          event.type === 'warning' ? 'text-warning' :
                          event.type === 'error' ? 'text-danger' : 'text-muted-foreground'
                        }`}>
                          {event.type.toUpperCase()}
                        </span>
                        <span className="flex-1">{event.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;