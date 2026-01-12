import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FounderSyncProps {
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

interface Question {
  id: number;
  text: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Two important paths are open for your startup, but you can only choose one. What feels most natural?",
    options: [
      { value: 'A', label: 'Choose the one that fits the long-term direction' },
      { value: 'B', label: 'Choose the one that can be tested fastest' },
      { value: 'C', label: 'Choose the one that energizes the team most' },
    ]
  },
  {
    id: 2,
    text: "You and your co-founder strongly support different ideas. How should the final call be made?",
    options: [
      { value: 'A', label: 'Compare data and decide logically' },
      { value: 'B', label: 'Follow the direction that fits the bigger vision' },
      { value: 'C', label: 'Let the person closest to the problem decide' },
    ]
  },
  {
    id: 3,
    text: "When building a company, what gives you the most satisfaction?",
    options: [
      { value: 'A', label: 'Solving complex problems' },
      { value: 'B', label: 'Shaping what the product will become' },
      { value: 'C', label: 'Seeing real progress and growth' },
    ]
  },
  {
    id: 4,
    text: "A major setback hits the startup. What matters most in your first response?",
    options: [
      { value: 'A', label: 'Understanding what went wrong' },
      { value: 'B', label: 'Re-aligning everyone around the bigger goal' },
      { value: 'C', label: 'Taking fast action to stabilize things' },
    ]
  },
  {
    id: 5,
    text: "Your co-founder is also good at something you are strong at. How should work be handled?",
    options: [
      { value: 'A', label: 'Split the work evenly' },
      { value: 'B', label: 'Let whoever performs best take the lead' },
      { value: 'C', label: 'One person shifts focus to something else' },
    ]
  },
  {
    id: 6,
    text: "When facing uncertainty, you usually feel more comfortable…",
    options: [
      { value: 'A', label: 'Thinking deeply before acting' },
      { value: 'B', label: 'Holding on to a clear long-term direction' },
      { value: 'C', label: 'Trying something and learning from it' },
    ]
  },
  {
    id: 7,
    text: "If your co-founder wants to take a risk you are unsure about, you usually…",
    options: [
      { value: 'A', label: 'Ask for more details first' },
      { value: 'B', label: 'Think about how it fits the bigger vision' },
      { value: 'C', label: 'Try it on a small scale' },
    ]
  },
  {
    id: 8,
    text: "What do you value most in a business partner?",
    options: [
      { value: 'A', label: 'Reliability and competence' },
      { value: 'B', label: 'Shared belief in the mission' },
      { value: 'C', label: 'Drive and execution' },
    ]
  },
  {
    id: 9,
    text: "When leading a team, what do you rely on most?",
    options: [
      { value: 'A', label: 'Logic and structure' },
      { value: 'B', label: 'Inspiration and purpose' },
      { value: 'C', label: 'Momentum and action' },
    ]
  },
  {
    id: 10,
    text: "What keeps a co-founder relationship strong over time?",
    options: [
      { value: 'A', label: 'Trust' },
      { value: 'B', label: 'Shared direction' },
      { value: 'C', label: "Respect for each other's roles" },
    ]
  }
];

// Derive personality insights from answers
const derivePersonalityType = (answers: Record<number, string>): string => {
  const counts = { A: 0, B: 0, C: 0 };
  Object.values(answers).forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });
  
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Analytical';
  if (counts.B === max) return 'Visionary';
  return 'Executor';
};

const deriveLeadershipStyle = (answers: Record<number, string>): string => {
  // Focus on questions 4, 9, and 10 for leadership style
  const leadershipAnswers = [answers[4], answers[9], answers[10]];
  const counts = { A: 0, B: 0, C: 0 };
  leadershipAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });
  
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Structured';
  if (counts.B === max) return 'Inspirational';
  return 'Action-Oriented';
};

const deriveRiskTolerance = (answers: Record<number, string>): string => {
  // Focus on questions 1, 6, and 7 for risk tolerance
  const riskAnswers = [answers[1], answers[6], answers[7]];
  const counts = { A: 0, B: 0, C: 0 };
  riskAnswers.forEach(answer => {
    if (answer === 'A' || answer === 'B' || answer === 'C') {
      counts[answer]++;
    }
  });
  
  const max = Math.max(counts.A, counts.B, counts.C);
  if (counts.A === max) return 'Conservative';
  if (counts.B === max) return 'Strategic';
  return 'Adaptive';
};

export default function FounderSync({ onComplete, onSkip, showSkip = true }: FounderSyncProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [otherTexts, setOtherTexts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showSkipDisclaimer, setShowSkipDisclaimer] = useState(false);

  const question = QUESTIONS[currentQuestion - 1];

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  };

  const handleOtherTextChange = (text: string) => {
    setOtherTexts(prev => ({ ...prev, [currentQuestion]: text }));
  };

  const handleNext = () => {
    if (currentQuestion < 10) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Build answers JSON with other text included
      const formattedAnswers: Record<string, string> = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer === 'D' && otherTexts[parseInt(questionId)]) {
          formattedAnswers[`q${questionId}`] = `Other: ${otherTexts[parseInt(questionId)]}`;
        } else {
          formattedAnswers[`q${questionId}`] = answer;
        }
      });

      // Derive personality insights
      const personalityType = derivePersonalityType(answers);
      const leadershipStyle = deriveLeadershipStyle(answers);
      const riskTolerance = deriveRiskTolerance(answers);

      // Check if user already has results
      const { data: existingResults } = await supabase
        .from('foundersync_results')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingResults) {
        // Update existing results
        const { error } = await supabase
          .from('foundersync_results')
          .update({
            answers: formattedAnswers,
            personality_type: personalityType,
            leadership_style: leadershipStyle,
            risk_tolerance: riskTolerance,
            completed_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new results
        const { error } = await supabase
          .from('foundersync_results')
          .insert({
            user_id: user.id,
            answers: formattedAnswers,
            personality_type: personalityType,
            leadership_style: leadershipStyle,
            risk_tolerance: riskTolerance
          });

        if (error) throw error;
      }

      // Trigger the FounderSync Intelligence Engine
      try {
        console.log('Triggering FounderSync Intelligence Engine...');
        const { data: matcherResult, error: matcherError } = await supabase.functions.invoke('foundersync-matcher', {
          body: { user_id: user.id }
        });

        if (matcherError) {
          console.error('FounderSync matcher error:', matcherError);
          // Don't block completion, just log the error
        } else {
          console.log('FounderSync matcher completed:', matcherResult);
        }
      } catch (matcherError) {
        console.error('Failed to run FounderSync matcher:', matcherError);
        // Don't block completion
      }

      setCompleted(true);
    } catch (error) {
      console.error('Error saving FounderSync results:', error);
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipDisclaimer(true);
  };

  const confirmSkip = () => {
    onSkip?.();
  };

  const isCurrentAnswered = !!answers[currentQuestion];
  const allAnswered = Object.keys(answers).length === 10;

  // Skip disclaimer screen
  if (showSkipDisclaimer) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            Are you sure?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-200 text-center">
              Skipping FounderSync means we won't be able to show you the most compatible co-founders. 
              Your match recommendations may be less accurate without this information.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowSkipDisclaimer(false)}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button 
              variant="secondary" 
              onClick={confirmSkip}
              className="flex-1"
            >
              Skip Anyway
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completion screen
  if (completed) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold gradient-text">
            Thank You for Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your answers help us show you founders you're more likely to work well with.
          </p>
          <p className="text-sm text-muted-foreground">
            We'll use these insights to improve your match recommendations and help you find the right co-founder.
          </p>
          
          <Button onClick={onComplete} variant="hero" className="w-full">
            <Check className="mr-2 h-4 w-4" />
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">FounderSync</span>
        </div>
        <CardTitle className="text-xl font-semibold">
          Understanding Your Style
        </CardTitle>
        <p className="text-muted-foreground text-sm mt-2">
          Question {currentQuestion} of 10
        </p>
        
        {/* Progress indicator */}
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < currentQuestion 
                    ? 'bg-primary' 
                    : i === currentQuestion - 1 
                      ? 'bg-primary' 
                      : 'bg-muted'
                } ${answers[i + 1] ? 'bg-primary' : ''}`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <p className="text-lg font-medium text-center leading-relaxed">
          {question.text}
        </p>
        
        <RadioGroup
          value={answers[currentQuestion] || ''}
          onValueChange={handleAnswerChange}
          className="space-y-3"
        >
          {question.options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent ${
                answers[currentQuestion] === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              onClick={() => handleAnswerChange(option.value)}
            >
              <RadioGroupItem value={option.value} id={`q${currentQuestion}-${option.value}`} />
              <Label 
                htmlFor={`q${currentQuestion}-${option.value}`} 
                className="flex-1 cursor-pointer text-sm"
              >
                {option.label}
              </Label>
            </div>
          ))}
          
          {/* Other option */}
          <div
            className={`flex flex-col space-y-2 p-4 rounded-lg border transition-all ${
              answers[currentQuestion] === 'D'
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
          >
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => handleAnswerChange('D')}
            >
              <RadioGroupItem value="D" id={`q${currentQuestion}-D`} />
              <Label htmlFor={`q${currentQuestion}-D`} className="cursor-pointer text-sm">
                Other
              </Label>
            </div>
            {answers[currentQuestion] === 'D' && (
              <Textarea
                placeholder="Share your perspective..."
                value={otherTexts[currentQuestion] || ''}
                onChange={(e) => handleOtherTextChange(e.target.value)}
                className="mt-2"
                rows={2}
              />
            )}
          </div>
        </RadioGroup>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {showSkip && (
              <Button
                variant="ghost"
                onClick={handleSkipClick}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}
            
            {currentQuestion < 10 ? (
              <Button
                onClick={handleNext}
                disabled={!isCurrentAnswered}
                variant="hero"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || loading}
                variant="hero"
              >
                {loading ? 'Saving...' : 'Complete'}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
