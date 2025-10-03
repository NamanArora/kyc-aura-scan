import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, RotateCw, Smile, Volume2 } from "lucide-react";
import { KYCSession } from "@/utils/mockEngine";

interface PromptCardProps {
  session: KYCSession;
}

const LIVENESS_PROMPTS = [
  { icon: Eye, text: "Blink twice slowly", duration: 3000 },
  { icon: RotateCw, text: "Turn your head left, then right", duration: 4000 },
  { icon: Smile, text: "Smile naturally", duration: 2000 },
  { icon: Volume2, text: "Say: 'I am verifying my identity'", duration: 4000 },
  { icon: Eye, text: "Look up, then down", duration: 3000 },
  { icon: RotateCw, text: "Nod your head yes", duration: 2000 }
];

export const PromptCard = ({ session }: PromptCardProps) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (session.status === 'processing' && !isActive) {
      setIsActive(true);
      startPromptSequence();
    } else if (session.status === 'completed') {
      setIsActive(false);
    }
  }, [session.status]);

  const startPromptSequence = () => {
    let promptIndex = 0;
    
    const showNextPrompt = () => {
      if (promptIndex >= LIVENESS_PROMPTS.length) {
        setIsActive(false);
        return;
      }

      const prompt = LIVENESS_PROMPTS[promptIndex];
      setCurrentPromptIndex(promptIndex);
      setTimeRemaining(prompt.duration);

      // Countdown timer
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 100) {
            clearInterval(interval);
            promptIndex++;
            setTimeout(showNextPrompt, 500);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    };

    showNextPrompt();
  };

  const currentPrompt = LIVENESS_PROMPTS[currentPromptIndex];
  const IconComponent = currentPrompt.icon;
  const progress = timeRemaining > 0 ? ((currentPrompt.duration - timeRemaining) / currentPrompt.duration) * 100 : 0;

  if (session.status === 'initializing') {
    return (
      <Card className="border-card-border bg-gradient-surface">
        <CardHeader>
          <CardTitle>Ready to Start</CardTitle>
          <CardDescription>
            Click "Start Analysis" to begin the KYC verification process
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Ensure good lighting and position yourself clearly in the frame
          </p>
        </CardContent>
      </Card>
    );
  }

  if (session.status === 'completed') {
    return (
      <Card className="border-card-border bg-gradient-surface">
        <CardHeader>
          <CardTitle>Verification Complete</CardTitle>
          <CardDescription>
            All security checks have been processed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            session.decision === 'PASS' ? 'bg-success/10' : 'bg-danger/10'
          }`}>
            <Eye className={`w-10 h-10 ${
              session.decision === 'PASS' ? 'text-success' : 'text-danger'
            }`} />
          </div>
          <Badge
            variant={session.decision === 'PASS' ? 'default' : 'destructive'}
            className="text-lg px-4 py-2"
          >
            {session.decision}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-card-border bg-gradient-surface">
      <CardHeader>
        <CardTitle>Liveness Challenge</CardTitle>
        <CardDescription>
          Follow the prompts to verify you are a live person
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <IconComponent className="w-10 h-10 text-primary" />
          </div>
          
          {/* Progress ring */}
          {isActive && timeRemaining > 0 && (
            <svg className="absolute inset-0 w-20 h-20 mx-auto -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                className="text-primary transition-all duration-100"
              />
            </svg>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">{currentPrompt.text}</h3>
        
        {isActive && timeRemaining > 0 && (
          <p className="text-muted-foreground">
            {Math.ceil(timeRemaining / 1000)}s remaining
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          {LIVENESS_PROMPTS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentPromptIndex 
                  ? 'bg-success' 
                  : index === currentPromptIndex && isActive
                    ? 'bg-primary' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};