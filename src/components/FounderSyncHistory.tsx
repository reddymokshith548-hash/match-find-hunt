import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Target, Flame, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface HistoryEntry {
  id: string;
  personality_type: string;
  leadership_style: string;
  risk_tolerance: string;
  completed_at: string;
}

const traitLabels: Record<string, Record<string, { label: string; color: string }>> = {
  personality_type: {
    analytical: { label: 'Analytical', color: 'bg-blue-500' },
    visionary: { label: 'Visionary', color: 'bg-purple-500' },
    executional: { label: 'Executional', color: 'bg-orange-500' },
    Analytical: { label: 'Analytical', color: 'bg-blue-500' },
    Visionary: { label: 'Visionary', color: 'bg-purple-500' },
    Executor: { label: 'Executor', color: 'bg-orange-500' },
  },
  leadership_style: {
    strategist: { label: 'Strategist', color: 'bg-indigo-500' },
    operator: { label: 'Operator', color: 'bg-green-500' },
    collaborator: { label: 'Collaborator', color: 'bg-cyan-500' },
    Structured: { label: 'Structured', color: 'bg-indigo-500' },
    Inspirational: { label: 'Inspirational', color: 'bg-cyan-500' },
    'Action-Oriented': { label: 'Action-Oriented', color: 'bg-green-500' },
  },
  risk_tolerance: {
    low: { label: 'Cautious', color: 'bg-slate-500' },
    medium: { label: 'Balanced', color: 'bg-amber-500' },
    high: { label: 'Bold', color: 'bg-red-500' },
    Conservative: { label: 'Conservative', color: 'bg-slate-500' },
    Strategic: { label: 'Strategic', color: 'bg-amber-500' },
    Adaptive: { label: 'Adaptive', color: 'bg-red-500' },
  },
};

const getTraitInfo = (traitType: string, value: string) => {
  const map = traitLabels[traitType];
  return map?.[value] || { label: value, color: 'bg-gray-500' };
};

const TraitChange = ({ 
  icon: Icon, 
  label, 
  current, 
  previous, 
  traitType 
}: { 
  icon: React.ElementType;
  label: string;
  current: string;
  previous?: string;
  traitType: string;
}) => {
  const currentInfo = getTraitInfo(traitType, current);
  const previousInfo = previous ? getTraitInfo(traitType, previous) : null;
  const hasChanged = previous && current !== previous;

  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`${currentInfo.color} text-white`}>
              {currentInfo.label}
            </Badge>
            {hasChanged && previousInfo && (
              <>
                <span className="text-xs text-muted-foreground">from</span>
                <Badge variant="outline" className="text-xs">
                  {previousInfo.label}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      {hasChanged && (
        <div className="flex items-center text-amber-500">
          <TrendingUp className="w-4 h-4" />
        </div>
      )}
      {!hasChanged && previous && (
        <div className="flex items-center text-muted-foreground">
          <Minus className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default function FounderSyncHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('foundersync_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trait History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trait History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No history yet. Complete FounderSync to start tracking your traits over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = history[0];
  const previous = history.length > 1 ? history[1] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Trait Evolution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {history.length > 1 
            ? `You've completed FounderSync ${history.length} times` 
            : 'Your current traits'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Traits */}
        <div className="space-y-3">
          <TraitChange
            icon={Brain}
            label="Thinking Style"
            current={current.personality_type}
            previous={previous?.personality_type}
            traitType="personality_type"
          />
          <TraitChange
            icon={Target}
            label="Leadership Style"
            current={current.leadership_style}
            previous={previous?.leadership_style}
            traitType="leadership_style"
          />
          <TraitChange
            icon={Flame}
            label="Risk Tolerance"
            current={current.risk_tolerance}
            previous={previous?.risk_tolerance}
            traitType="risk_tolerance"
          />
        </div>

        {/* History Timeline */}
        {history.length > 1 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Assessment History</h4>
            <div className="space-y-2">
              {history.slice(0, 5).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-2 rounded ${
                    index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    <span className="text-sm">
                      {format(new Date(entry.completed_at), 'MMM d, yyyy')}
                    </span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">Latest</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getTraitInfo('personality_type', entry.personality_type).label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
