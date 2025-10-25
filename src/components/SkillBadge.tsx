import { Badge } from '@/components/ui/badge';
import { useSkillColors } from '@/hooks/useSkillColors';

interface SkillBadgeProps {
  skill: string;
  className?: string;
}

export default function SkillBadge({ skill, className = '' }: SkillBadgeProps) {
  const { getSkillColor } = useSkillColors();
  const color = getSkillColor(skill);

  return (
    <Badge 
      className={`${className}`}
      style={{ 
        backgroundColor: color,
        color: 'white',
        borderColor: color
      }}
    >
      {skill}
    </Badge>
  );
}
