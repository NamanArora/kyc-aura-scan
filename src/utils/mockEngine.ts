// Mock KYC Engine for demonstration purposes

export interface KYCCheck {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timeline: { timestamp: number; score: number }[];
}

export interface KYCSession {
  id: string;
  type: 'upload' | 'live';
  status: 'initializing' | 'processing' | 'completed' | 'failed';
  scenario: DemoScenario;
  checks: KYCCheck[];
  events: SessionEvent[];
  finalScore: number;
  decision: 'PASS' | 'RETRY' | 'FAIL';
  reasoning: string[];
  startTime: number;
  endTime?: number;
}

export interface SessionEvent {
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  checkId?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  targetDecision: 'PASS' | 'RETRY' | 'FAIL';
  scorePatterns: Record<string, { min: number; max: number; volatility: number }>;
  events: Omit<SessionEvent, 'timestamp'>[];
}

// Demo Scenarios
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'genuine-pass',
    name: 'Genuine Pass',
    description: 'Clean verification with high confidence scores',
    targetDecision: 'PASS',
    scorePatterns: {
      'active-liveness': { min: 85, max: 95, volatility: 0.1 },
      'passive-forensics': { min: 88, max: 96, volatility: 0.08 },
      'head-pose': { min: 82, max: 92, volatility: 0.12 },
      'micro-dynamics': { min: 79, max: 89, volatility: 0.15 },
      'lip-audio-sync': { min: 86, max: 94, volatility: 0.1 },
      'temporal-integrity': { min: 84, max: 93, volatility: 0.09 },
      'face-match': { min: 91, max: 97, volatility: 0.06 }
    },
    events: [
      { type: 'info', message: 'Face detected in frame' },
      { type: 'success', message: 'Liveness challenge completed successfully' },
      { type: 'info', message: 'Audio quality: Excellent' },
      { type: 'success', message: 'Face matching completed with high confidence' }
    ]
  },
  {
    id: 'deepfake-suspicion',
    name: 'Deepfake Suspicion',
    description: 'Suspicious patterns indicating potential deepfake',
    targetDecision: 'FAIL',
    scorePatterns: {
      'active-liveness': { min: 45, max: 65, volatility: 0.2 },
      'passive-forensics': { min: 25, max: 45, volatility: 0.25 },
      'head-pose': { min: 35, max: 55, volatility: 0.18 },
      'micro-dynamics': { min: 30, max: 50, volatility: 0.22 },
      'lip-audio-sync': { min: 28, max: 48, volatility: 0.25 },
      'temporal-integrity': { min: 32, max: 52, volatility: 0.2 },
      'face-match': { min: 75, max: 85, volatility: 0.1 }
    },
    events: [
      { type: 'warning', message: 'Unusual micro-expression patterns detected' },
      { type: 'error', message: 'Temporal inconsistencies in facial features' },
      { type: 'warning', message: 'Audio-visual synchronization anomalies' },
      { type: 'error', message: 'Deep learning artifacts detected in video stream' }
    ]
  },
  {
    id: 'replay-detected',
    name: 'Replay Attack',
    description: 'Video replay attack detected',
    targetDecision: 'FAIL',
    scorePatterns: {
      'active-liveness': { min: 15, max: 35, volatility: 0.3 },
      'passive-forensics': { min: 65, max: 75, volatility: 0.1 },
      'head-pose': { min: 70, max: 85, volatility: 0.08 },
      'micro-dynamics': { min: 20, max: 40, volatility: 0.25 },
      'lip-audio-sync': { min: 75, max: 90, volatility: 0.12 },
      'temporal-integrity': { min: 45, max: 65, volatility: 0.15 },
      'face-match': { min: 85, max: 95, volatility: 0.08 }
    },
    events: [
      { type: 'error', message: 'No response to liveness challenges' },
      { type: 'warning', message: 'Static background detected' },
      { type: 'error', message: 'Lack of natural micro-movements' },
      { type: 'error', message: 'Video replay patterns identified' }
    ]
  },
  {
    id: 'noisy-audio',
    name: 'Noisy Environment',
    description: 'Poor audio quality requiring retry',
    targetDecision: 'RETRY',
    scorePatterns: {
      'active-liveness': { min: 75, max: 85, volatility: 0.12 },
      'passive-forensics': { min: 80, max: 90, volatility: 0.1 },
      'head-pose': { min: 78, max: 88, volatility: 0.11 },
      'micro-dynamics': { min: 72, max: 82, volatility: 0.14 },
      'lip-audio-sync': { min: 35, max: 55, volatility: 0.3 },
      'temporal-integrity': { min: 76, max: 86, volatility: 0.12 },
      'face-match': { min: 85, max: 92, volatility: 0.08 }
    },
    events: [
      { type: 'info', message: 'Face detection: Normal' },
      { type: 'warning', message: 'Background noise detected' },
      { type: 'error', message: 'Audio quality below threshold' },
      { type: 'warning', message: 'Lip-sync analysis inconclusive due to audio issues' }
    ]
  },
  {
    id: 'face-mismatch',
    name: 'Face Mismatch',
    description: 'Person does not match provided ID',
    targetDecision: 'FAIL',
    scorePatterns: {
      'active-liveness': { min: 82, max: 92, volatility: 0.1 },
      'passive-forensics': { min: 85, max: 93, volatility: 0.09 },
      'head-pose': { min: 80, max: 90, volatility: 0.11 },
      'micro-dynamics': { min: 78, max: 88, volatility: 0.13 },
      'lip-audio-sync': { min: 83, max: 91, volatility: 0.1 },
      'temporal-integrity': { min: 81, max: 89, volatility: 0.12 },
      'face-match': { min: 25, max: 45, volatility: 0.2 }
    },
    events: [
      { type: 'info', message: 'Liveness verification: Passed' },
      { type: 'info', message: 'Video quality: Good' },
      { type: 'error', message: 'Face matching score below threshold' },
      { type: 'error', message: 'Identity verification failed' }
    ]
  }
];

// Default check configurations
const DEFAULT_CHECKS: Omit<KYCCheck, 'score' | 'timeline'>[] = [
  {
    id: 'active-liveness',
    name: 'Active Liveness',
    description: 'Challenge-response verification to detect live person',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'passive-forensics',
    name: 'Passive Forensics',
    description: 'AI-powered deepfake and manipulation detection',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'head-pose',
    name: 'Head Pose (3D)',
    description: '3D head tracking and pose estimation analysis',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'micro-dynamics',
    name: 'Micro-Dynamics',
    description: 'Natural facial micro-expressions and movements',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'lip-audio-sync',
    name: 'Lip-Audio Sync',
    description: 'Correlation between lip movement and speech',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'temporal-integrity',
    name: 'Temporal Integrity',
    description: 'Consistency analysis across video timeline',
    maxScore: 100,
    status: 'pending'
  },
  {
    id: 'face-match',
    name: 'Face Match vs ID',
    description: 'Identity verification against provided documents',
    maxScore: 100,
    status: 'pending'
  }
];

export class MockKYCEngine {
  private sessions: Map<string, KYCSession> = new Map();
  private timers: Map<string, NodeJS.Timeout[]> = new Map();

  createSession(sessionId: string, type: 'upload' | 'live', scenario: DemoScenario): KYCSession {
    const session: KYCSession = {
      id: sessionId,
      type,
      status: 'initializing',
      scenario,
      checks: DEFAULT_CHECKS.map(check => ({
        ...check,
        score: 0,
        timeline: []
      })),
      events: [
        {
          timestamp: Date.now(),
          type: 'info',
          message: `${type === 'live' ? 'Live' : 'Upload'} KYC session initialized`
        }
      ],
      finalScore: 0,
      decision: 'PASS',
      reasoning: [],
      startTime: Date.now()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  startProcessing(sessionId: string, onUpdate: (session: KYCSession) => void): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'processing';
    const timers: NodeJS.Timeout[] = [];

    // Add scenario events with realistic timing
    session.scenario.events.forEach((event, index) => {
      const timer = setTimeout(() => {
        session.events.push({
          ...event,
          timestamp: Date.now()
        });
        onUpdate(session);
      }, 1000 + index * 2000);
      timers.push(timer);
    });

    // Start processing each check
    session.checks.forEach((check, checkIndex) => {
      const pattern = session.scenario.scorePatterns[check.id];
      if (!pattern) return;

      check.status = 'processing';

      // Simulate progressive scoring
      let currentScore = 0;
      const targetScore = Math.random() * (pattern.max - pattern.min) + pattern.min;
      const steps = 20; // Number of updates
      const stepDelay = 300 + Math.random() * 500; // Random delay between updates

      for (let step = 0; step <= steps; step++) {
        const timer = setTimeout(() => {
          const progress = step / steps;
          // Add some volatility to make it realistic
          const volatility = (Math.random() - 0.5) * pattern.volatility * targetScore;
          currentScore = Math.min(100, Math.max(0, 
            progress * targetScore + (1 - progress) * volatility
          ));

          check.score = Math.round(currentScore);
          check.timeline.push({
            timestamp: Date.now(),
            score: check.score
          });

          if (step === steps) {
            check.status = 'completed';
            
            // Check if all checks are completed
            if (session.checks.every(c => c.status === 'completed')) {
              this.completeSession(sessionId);
            }
          }

          onUpdate(session);
        }, checkIndex * 1000 + step * stepDelay);
        
        timers.push(timer);
      }
    });

    this.timers.set(sessionId, timers);
  }

  private completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Calculate final score and decision
    const totalScore = session.checks.reduce((sum, check) => sum + check.score, 0);
    session.finalScore = Math.round(totalScore / session.checks.length);
    
    // Determine decision based on scenario
    session.decision = session.scenario.targetDecision;
    
    // Generate reasoning
    session.reasoning = this.generateReasoning(session);
    
    session.status = 'completed';
    session.endTime = Date.now();

    session.events.push({
      timestamp: Date.now(),
      type: session.decision === 'PASS' ? 'success' : session.decision === 'RETRY' ? 'warning' : 'error',
      message: `KYC verification completed: ${session.decision}`
    });
  }

  private generateReasoning(session: KYCSession): string[] {
    const reasoning: string[] = [];
    
    switch (session.decision) {
      case 'PASS':
        reasoning.push('All security checks passed with high confidence scores');
        reasoning.push('Live person detected with natural biometric patterns');
        reasoning.push('No signs of manipulation or fraud detected');
        break;
        
      case 'RETRY':
        const lowScoreChecks = session.checks.filter(c => c.score < 60);
        if (lowScoreChecks.length > 0) {
          reasoning.push(`Poor quality detected in: ${lowScoreChecks.map(c => c.name).join(', ')}`);
        }
        reasoning.push('Please retry with better lighting and audio conditions');
        reasoning.push('Ensure stable internet connection and clear video quality');
        break;
        
      case 'FAIL':
        const failedChecks = session.checks.filter(c => c.score < 50);
        if (failedChecks.length > 0) {
          reasoning.push(`Failed security checks: ${failedChecks.map(c => c.name).join(', ')}`);
        }
        reasoning.push('Potential fraud or manipulation detected');
        reasoning.push('Identity verification requirements not met');
        break;
    }
    
    return reasoning;
  }

  getSession(sessionId: string): KYCSession | undefined {
    return this.sessions.get(sessionId);
  }

  stopSession(sessionId: string): void {
    const timers = this.timers.get(sessionId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.timers.delete(sessionId);
    }
  }

  exportReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const report = {
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      type: session.type,
      scenario: session.scenario.name,
      duration: session.endTime ? session.endTime - session.startTime : 0,
      checks: session.checks.map(check => ({
        id: check.id,
        name: check.name,
        score: check.score,
        maxScore: check.maxScore,
        status: check.status,
        timeline: check.timeline
      })),
      events: session.events,
      finalScore: session.finalScore,
      decision: session.decision,
      reasoning: session.reasoning,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    // Generate SHA-256 hash
    const reportString = JSON.stringify(report, null, 2);
    
    return reportString;
  }

  async generateReportHash(reportString: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(reportString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Global engine instance
export const mockEngine = new MockKYCEngine();