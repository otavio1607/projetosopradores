import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'critical';
  subtitle?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const variantStyles = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    glow: 'shadow-[0_0_30px_hsl(210_100%_50%/0.2)]',
  },
  success: {
    text: 'text-status-ok',
    bg: 'bg-status-ok/10',
    border: 'border-status-ok/30',
    glow: 'shadow-[0_0_30px_hsl(145_70%_45%/0.2)]',
  },
  warning: {
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    glow: 'shadow-[0_0_30px_hsl(45_100%_50%/0.2)]',
  },
  danger: {
    text: 'text-status-critical',
    bg: 'bg-status-critical/10',
    border: 'border-status-critical/30',
    glow: 'shadow-[0_0_30px_hsl(0_85%_55%/0.2)]',
  },
  critical: {
    text: 'text-status-overdue',
    bg: 'bg-status-overdue/10',
    border: 'border-status-overdue/40',
    glow: 'shadow-[0_0_30px_hsl(0_100%_40%/0.3)]',
  },
};

export function StatCard({ title, value, icon, variant, subtitle, onClick, isActive }: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'industrial-card flex flex-col gap-3 transition-all duration-300 w-full text-left',
        'hover:scale-[1.02] hover:border-opacity-50',
        onClick && 'cursor-pointer',
        isActive && [styles.border, styles.glow, 'border-2'],
        !isActive && 'border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2 rounded-lg', styles.bg, styles.text)}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className={cn('stat-value', styles.text)}>
            {value}
          </span>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </button>
  );
}
