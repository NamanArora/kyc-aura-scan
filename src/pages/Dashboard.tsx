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
import {
  checkActiveLiveness,
  checkPassiveForensics,
  checkHeadPose,
  checkMicroDynamics,
  checkLipAudioSync,
  checkTemporalIntegrity,
  checkFaceMatch
} from "@/services/checks";

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

  const startAnalysis = async () => {
    if (!session) return;

    setIsProcessing(true);

    // Get video path from localStorage
    const storedSession = localStorage.getItem(`kyc-session-${session.id}`);
    const sessionData = storedSession ? JSON.parse(storedSession) : null;
    const videoPath = sessionData?.videoPath || sessionData?.videoFilename;

    if (!videoPath) {
      console.error('No video path found for session');
      setIsProcessing(false);
      return;
    }

    // Update session status
    session.status = 'processing';
    setSession({ ...session });

    // Run all checks - comment out any check to disable it
    const checkPromises = [
      runCheck('active-liveness', checkActiveLiveness, videoPath),
      runCheck('passive-forensics', checkPassiveForensics, videoPath),
      runCheck('head-pose', checkHeadPose, videoPath),
      runCheck('micro-dynamics', checkMicroDynamics, videoPath),
      runCheck('lip-audio-sync', checkLipAudioSync, videoPath),
      runCheck('temporal-integrity', checkTemporalIntegrity, videoPath),
      runCheck('face-match', checkFaceMatch, videoPath),
    ];

    // Wait for all checks to complete
    await Promise.all(checkPromises);

    // Mark session as completed and calculate final decision
    session.status = 'completed';

    // Calculate average score from all 7 security checks (each scored out of 100)
    // Sum all scores and divide by 7
    console.log('=== SCORE CALCULATION DEBUG ===');
    console.log('All checks:', session.checks.map(c => ({ name: c.name, score: c.score })));

    const totalScore = session.checks.reduce((sum, c) => sum + c.score, 0);
    const numChecks = session.checks.length; // Should be 7 checks

    console.log('Total Score:', totalScore);
    console.log('Number of Checks:', numChecks);
    console.log('Average (before rounding):', totalScore / numChecks);

    session.finalScore = Math.round(totalScore / numChecks);

    console.log('Final Score (rounded):', session.finalScore);
    console.log('================================');

    // Determine PASS/FAIL based on average score
    session.decision = session.finalScore >= 60 ? 'PASS' : 'FAIL';

    // Generate reasoning based on results
    session.reasoning = [];
    session.reasoning.push(`Average verification score: ${session.finalScore}/100`);

    if (session.decision === 'PASS') {
      session.reasoning.push('All security checks passed with sufficient confidence scores');
      const excellentChecks = session.checks.filter(c => c.score >= 90);
      if (excellentChecks.length > 0) {
        session.reasoning.push(`Excellent scores in: ${excellentChecks.map(c => c.name).join(', ')}`);
      }
    } else {
      const failedChecks = session.checks.filter(c => c.score < 60);
      if (failedChecks.length > 0) {
        session.reasoning.push(`Failed security checks: ${failedChecks.map(c => c.name).join(', ')}`);
      }
      session.reasoning.push('Average score below required threshold (60)');
      const criticalChecks = session.checks.filter(c => c.score < 30);
      if (criticalChecks.length > 0) {
        session.reasoning.push(`Critical failures in: ${criticalChecks.map(c => c.name).join(', ')}`);
      }
    }

    // Add completion event
    session.events.push({
      timestamp: Date.now(),
      type: session.decision === 'PASS' ? 'success' : 'error',
      message: `Verification completed: ${session.decision} (Average score: ${session.finalScore}/100)`
    });

    setSession({ ...session });
    setIsProcessing(false);
  };

  const runCheck = async (
    checkId: string,
    checkFn: (videoPath: string) => Promise<number>,
    videoPath: string
  ) => {
    const check = session?.checks.find(c => c.id === checkId);
    if (!check) return;

    try {
      check.status = 'processing';
      setSession({ ...session });

      const score = await checkFn(videoPath);
      await animateScore(check, score);
    } catch (error) {
      console.error(`Error running check ${checkId}:`, error);
      check.status = 'failed';
      setSession({ ...session });
    }
  };

  const animateScore = (check: any, targetScore: number): Promise<void> => {
    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = 50;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        check.score = Math.round(progress * targetScore);

        if (currentStep >= steps) {
          check.score = targetScore;
          check.status = 'completed';
          clearInterval(interval);
          setSession({ ...session });
          resolve(); // Resolve promise when animation completes
        } else {
          setSession({ ...session });
        }
      }, stepDuration);
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
      case 'FAIL': return 'text-danger';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'PASS': return 'default';
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
                <CardDescription>Average of all security checks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getStatusColor(session.decision)}`}>
                    {session.finalScore}/100
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Average Score</p>
                  <Badge
                    variant={session.decision === 'PASS' ? 'default' : 'destructive'}
                    className="mt-3 text-base px-4 py-1"
                  >
                    {session.decision}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-3">
                    {session.decision === 'PASS'
                      ? 'Score ≥ 60 required to pass'
                      : 'Score below 60 threshold'}
                  </p>
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