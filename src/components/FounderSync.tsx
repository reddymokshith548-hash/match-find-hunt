import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ALL_QUESTIONS, 
  TOTAL_QUESTIONS, 
  getCategoryLabel, 
  getCategoryColor,
  deriveFounderArchetype,
  deriveDecisionStyle,
  deriveValuesProfile,
  deriveRiskTolerance,
  deriveLeadershipStyle,
  type FounderSyncAnswers 
} from '@/lib/founderSyncQuestions';

interface FounderSyncProps {
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export default function FounderSync({ onComplete, onSkip, showSkip = true }: FounderSyncProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [otherTexts, setOtherTexts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showSkipDisclaimer, setShowSkipDisclaimer] = useState(false);

  const question = ALL_QUESTIONS[currentQuestion - 1];
  const progress = (currentQuestion / TOTAL_QUESTIONS) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  };

  const handleOtherTextChange = (text: string) => {
    setOtherTexts(prev => ({ ...prev, [currentQuestion]: text }));
  };

  const handleNext = () => {
    if (currentQuestion < TOTAL_QUESTIONS) {
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
      const formattedAnswers: FounderSyncAnswers = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer === 'D' && otherTexts[parseInt(questionId)]) {
          formattedAnswers[`q${questionId}`] = `Other: ${otherTexts[parseInt(questionId)]}`;
        } else {
          formattedAnswers[`q${questionId}`] = answer;
        }
      });

      // Derive all traits from the 30 questions
      const founderArchetype = deriveFounderArchetype(formattedAnswers);
      const decisionStyle = deriveDecisionStyle(formattedAnswers);
      const valuesProfile = deriveValuesProfile(formattedAnswers);
      const riskTolerance = deriveRiskTolerance(formattedAnswers);
      const leadershipStyle = deriveLeadershipStyle(formattedAnswers);

      // Combine into personality type for backward compatibility
      const personalityType = `${founderArchetype} - ${valuesProfile}`;

      const { data: existingResults } = await supabase
        .from('foundersync_results')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingResults) {
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

      // Update profile test_completed flag
      await supabase
        .from('profiles')
        .update({ test_completed: true })
        .eq('user_id', user.id);

      // Trigger matcher
      try {
        await supabase.functions.invoke('foundersync-matcher', {
          body: { user_id: user.id }
        });
      } catch (e) {
        console.error('Matcher error:', e);
      }

      setCompleted(true);
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: "Error", description: "Failed to save responses.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentAnswered = !!answers[currentQuestion];
  const allAnswered = Object.keys(answers).length === TOTAL_QUESTIONS;

  if (showSkipDisclaimer) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">Are you sure?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-800 dark:text-amber-200 text-center">
              Skipping means less accurate co-founder matches based only on profile data.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowSkipDisclaimer(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />Go Back
            </Button>
            <Button variant="secondary" onClick={onSkip}>Skip Anyway</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl gradient-text">Founder Sync Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your insights are now powering smarter co-founder matches using our dual-model compatibility engine.
          </p>
          <Button onClick={onComplete} variant="hero" className="w-full">
            <Check className="mr-2 h-4 w-4" />Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Founder Sync Test</span>
        </div>
        <Badge variant="outline" className={getCategoryColor(question.category)}>
          {getCategoryLabel(question.category)}
        </Badge>
        <p className="text-muted-foreground text-sm mt-2">
          Question {currentQuestion} of {TOTAL_QUESTIONS}
        </p>
        <div className="w-full bg-muted h-2 rounded-full mt-3">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <p className="text-lg font-medium text-center leading-relaxed">{question.text}</p>
        
        <RadioGroup value={answers[currentQuestion] || ''} onValueChange={handleAnswerChange} className="space-y-3">
          {question.options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent ${
                answers[currentQuestion] === option.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => handleAnswerChange(option.value)}
            >
              <RadioGroupItem value={option.value} id={`q${currentQuestion}-${option.value}`} />
              <Label htmlFor={`q${currentQuestion}-${option.value}`} className="flex-1 cursor-pointer text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {answers[currentQuestion] === 'D' && (
          <Textarea
            placeholder="Share your perspective..."
            value={otherTexts[currentQuestion] || ''}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            rows={2}
          />
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />Previous
          </Button>
          
          <div className="flex gap-2">
            {showSkip && (
              <Button variant="ghost" onClick={() => setShowSkipDisclaimer(true)} className="text-muted-foreground">
                Skip
              </Button>
            )}
            
            {currentQuestion < TOTAL_QUESTIONS ? (
              <Button onClick={handleNext} disabled={!isCurrentAnswered} variant="hero">
                Next<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!allAnswered || loading} variant="hero">
                {loading ? 'Processing...' : 'Complete'}<Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
