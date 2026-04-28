import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGoToPricing } from '@/hooks/useGoToPricing';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, SlidersHorizontal, Lock } from 'lucide-react';

export interface MatchFiltersState {
  minCompatibility: number;
  phase: 'all' | 'phase1' | 'phase2';
  skills: string[];
}

interface MatchFiltersProps {
  filters: MatchFiltersState;
  onFiltersChange: (filters: MatchFiltersState) => void;
  availableSkills?: string[];
  /** When false, paid filter fields are visible but disabled with a Pro lock badge. */
  isPaid?: boolean;
}

const COMMON_SKILLS = [
  'React', 'Python', 'Marketing', 'Sales', 'Product', 'Design',
  'AI/ML', 'Growth', 'Finance', 'DevOps', 'Business Strategy'
];

export default function MatchFilters({
  filters,
  onFiltersChange,
  availableSkills = COMMON_SKILLS,
  isPaid = true,
}: MatchFiltersProps) {
  const [open, setOpen] = useState(false);
  const goPricing = useGoToPricing();

  // Per-field Pro gates. Compatibility slider stays free.
  const PAID_FIELDS = ['phase', 'skills'] as const;
  type PaidField = typeof PAID_FIELDS[number];
  const isLocked = (field: PaidField) => !isPaid;

  const ProLockBadge = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        goPricing();
      }}
      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition"
      title="Upgrade to Pro to unlock"
    >
      <Lock className="w-2.5 h-2.5" />
      Pro
    </button>
  );
  
  const activeFiltersCount = 
    (filters.minCompatibility > 0 ? 1 : 0) +
    (filters.phase !== 'all' ? 1 : 0) +
    filters.skills.length;

  const handleMinCompatibilityChange = (value: number[]) => {
    onFiltersChange({ ...filters, minCompatibility: value[0] });
  };

  const handlePhaseChange = (value: string) => {
    onFiltersChange({ ...filters, phase: value as MatchFiltersState['phase'] });
  };

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onFiltersChange({ ...filters, skills: newSkills });
  };

  const clearFilters = () => {
    onFiltersChange({
      minCompatibility: 0,
      phase: 'all',
      skills: [],
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Match Filters</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Minimum Compatibility */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Min Compatibility
              </label>
              <span className="text-sm text-muted-foreground">
                {filters.minCompatibility}%+
              </span>
            </div>
            <Slider
              value={[filters.minCompatibility]}
              onValueChange={handleMinCompatibilityChange}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>All</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Match Phase */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Match Type</label>
              {isLocked('phase') && <ProLockBadge />}
            </div>
            <Select
              value={filters.phase}
              onValueChange={handlePhaseChange}
              disabled={isLocked('phase')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                <SelectItem value="phase2">
                  FounderSync Verified
                </SelectItem>
                <SelectItem value="phase1">
                  Profile-Based Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Skills Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Skills</label>
              {isLocked('skills') && <ProLockBadge />}
            </div>
            <div className={`flex flex-wrap gap-1.5 ${isLocked('skills') ? 'opacity-50 pointer-events-none' : ''}`}>
              {availableSkills.slice(0, 8).map(skill => (
                <Badge
                  key={skill}
                  variant={filters.skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-colors"
                  onClick={() => !isLocked('skills') && toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {filters.skills.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {filters.skills.length} skill{filters.skills.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {!isPaid && (
            <div className="pt-3 border-t">
              <Button
                variant="hero"
                size="sm"
                className="w-full"
                onClick={() => goPricing()}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Upgrade to unlock all filters
              </Button>
            </div>
          )}

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Showing matches with {filters.minCompatibility > 0 && `≥${filters.minCompatibility}% compatibility`}
                {filters.phase !== 'all' && ` • ${filters.phase === 'phase2' ? 'FounderSync verified' : 'Profile-based'}`}
                {filters.skills.length > 0 && ` • ${filters.skills.length} skills`}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
