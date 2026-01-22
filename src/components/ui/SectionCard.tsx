// src/components/ui/SectionCard.tsx
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

/**
 * Reusable card component for profile detail sections.
 */
export function SectionCard({
  icon: Icon,
  title,
  iconColor = 'text-slate-600',
  gradientFrom = 'from-slate-50',
  gradientTo = 'to-slate-50',
  borderColor = 'border-slate-200',
  children,
  headerAction,
}: SectionCardProps) {
  return (
    <section className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} p-5 rounded-xl border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Icon size={18} className={iconColor} /> {title}
        </h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}

/**
 * Simple section header without card wrapper
 */
interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  iconColor?: string;
}

export function SectionHeader({ icon: Icon, title, iconColor = 'text-slate-600' }: SectionHeaderProps) {
  return (
    <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
      {Icon && <Icon size={18} className={iconColor} />} {title}
    </h2>
  );
}
