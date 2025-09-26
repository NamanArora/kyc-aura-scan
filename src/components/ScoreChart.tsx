import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KYCSession } from "@/utils/mockEngine";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreChartProps {
  session: KYCSession;
}

export const ScoreChart = ({ session }: ScoreChartProps) => {
  // Simple sparkline component
  const Sparkline = ({ data, color = "text-primary" }: { data: number[], color?: string }) => {
    if (data.length < 2) return <div className="h-8 w-full bg-muted rounded"></div>;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="h-8 w-full">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={color}
          />
          {data.map((_, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((data[index] - min) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1"
                fill="currentColor"
                className={color}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // Gauge component for lip-audio sync
  const Gauge = ({ value, max = 100 }: { value: number, max?: number }) => {
    const percentage = (value / max) * 100;
    const angle = (percentage / 100) * 180 - 90;
    
    const getGaugeColor = (val: number) => {
      if (val >= 80) return "text-success";
      if (val >= 60) return "text-warning";
      return "text-danger";
    };

    return (
      <div className="relative w-20 h-12 mx-auto">
        <svg width="80" height="48" viewBox="0 0 80 48" className="overflow-visible">
          {/* Background arc */}
          <path
            d="M 10 40 A 30 30 0 0 1 70 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted"
          />
          {/* Value arc */}
          <path
            d={`M 10 40 A 30 30 0 0 1 ${40 + 30 * Math.cos((angle * Math.PI) / 180)} ${40 + 30 * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className={getGaugeColor(value)}
          />
          {/* Needle */}
          <line
            x1="40"
            y1="40"
            x2={40 + 25 * Math.cos((angle * Math.PI) / 180)}
            y2={40 + 25 * Math.sin((angle * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="2"
            className={getGaugeColor(value)}
          />
          <circle cx="40" cy="40" r="3" fill="currentColor" className={getGaugeColor(value)} />
        </svg>
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-mono">
          {value}%
        </div>
      </div>
    );
  };

  const getTrendIcon = (data: number[]) => {
    if (data.length < 2) return <Minus className="w-3 h-3" />;
    const trend = data[data.length - 1] - data[0];
    if (trend > 5) return <TrendingUp className="w-3 h-3 text-success" />;
    if (trend < -5) return <TrendingDown className="w-3 h-3 text-danger" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // Get specific check data
  const blinkCheck = session.checks.find(c => c.id === 'active-liveness');
  const headPoseCheck = session.checks.find(c => c.id === 'head-pose');
  const lipSyncCheck = session.checks.find(c => c.id === 'lip-audio-sync');

  const blinkData = blinkCheck?.timeline.map(t => t.score) || [];
  const headPoseData = headPoseCheck?.timeline.map(t => t.score) || [];

  return (
    <Card className="border-card-border bg-gradient-surface">
      <CardHeader>
        <CardTitle>Real-time Analytics</CardTitle>
        <CardDescription>
          Live biometric and behavioral analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EAR Blink Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">EAR Blink Rate</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon(blinkData)}
              <Badge variant="outline" className="text-xs">
                {blinkCheck?.score || 0}%
              </Badge>
            </div>
          </div>
          <Sparkline data={blinkData} color="text-primary" />
          <p className="text-xs text-muted-foreground">
            Eye Aspect Ratio monitoring for liveness detection
          </p>
        </div>

        {/* Head Pose Tracking */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Head Pose (3D)</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon(headPoseData)}
              <Badge variant="outline" className="text-xs">
                {headPoseCheck?.score || 0}%
              </Badge>
            </div>
          </div>
          <Sparkline data={headPoseData} color="text-success" />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-mono text-warning">±{Math.round(Math.random() * 15)}°</div>
              <div className="text-muted-foreground">Yaw</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-warning">±{Math.round(Math.random() * 10)}°</div>
              <div className="text-muted-foreground">Pitch</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-warning">±{Math.round(Math.random() * 8)}°</div>
              <div className="text-muted-foreground">Roll</div>
            </div>
          </div>
        </div>

        {/* Lip-Audio Sync Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Lip-Audio Sync</h4>
            <Badge variant="outline" className="text-xs">
              {lipSyncCheck?.score || 0}%
            </Badge>
          </div>
          <Gauge value={lipSyncCheck?.score || 0} />
          <p className="text-xs text-muted-foreground text-center">
            Audio-visual correlation analysis
          </p>
        </div>
      </CardContent>
    </Card>
  );
};