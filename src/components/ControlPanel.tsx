import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_SCENARIOS, DemoScenario, KYCSession } from "@/utils/mockEngine";

interface ControlPanelProps {
  selectedScenario: DemoScenario;
  onScenarioChange: (scenario: DemoScenario) => void;
  session: KYCSession;
  onSessionUpdate: (session: KYCSession) => void;
}

export const ControlPanel = ({ 
  selectedScenario, 
  onScenarioChange,
  session,
  onSessionUpdate 
}: ControlPanelProps) => {
  
  const getScenarioBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'PASS': return 'default';
      case 'RETRY': return 'secondary';
      case 'FAIL': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <div className="space-y-3">
        <h3 className="font-medium">Demo Scenario</h3>
        <Select 
          value={selectedScenario.id} 
          onValueChange={(value) => {
            const scenario = DEMO_SCENARIOS.find(s => s.id === value);
            if (scenario) onScenarioChange(scenario);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEMO_SCENARIOS.map((scenario) => (
              <SelectItem key={scenario.id} value={scenario.id}>
                <div className="flex items-center gap-2">
                  <span>{scenario.name}</span>
                  <Badge variant={getScenarioBadgeVariant(scenario.targetDecision)} className="text-xs">
                    {scenario.targetDecision}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {selectedScenario.description}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-medium">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onScenarioChange(DEMO_SCENARIOS[0])}
          >
            Genuine Pass
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onScenarioChange(DEMO_SCENARIOS[1])}
          >
            Deepfake Fail
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onScenarioChange(DEMO_SCENARIOS[2])}
          >
            Replay Attack
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onScenarioChange(DEMO_SCENARIOS[3])}
          >
            Audio Issues
          </Button>
        </div>
      </div>

      {/* Current Session Info */}
      <Card className="bg-surface/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span className="capitalize">{session.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline" className="text-xs">
              {session.status}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scenario:</span>
            <span>{selectedScenario.name}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};