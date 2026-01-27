// src/components/ui/Logo.tsx
// Reusable Aura logo component with size variants

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { img: 'h-8 w-8', text: 'text-xl', tagline: 'text-xs' },
  md: { img: 'h-10 w-10', text: 'text-2xl', tagline: 'text-sm' },
  lg: { img: 'h-14 w-14', text: 'text-3xl', tagline: 'text-base' },
  xl: { img: 'h-20 w-20', text: 'text-4xl', tagline: 'text-lg' },
};

export default function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  className = ''
}: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-full.png"
        alt="Aura logo"
        className={`${sizes.img} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span
            className={`${sizes.text} font-bold bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent`}
          >
            Aura
          </span>
          {showTagline && (
            <span className={`${sizes.tagline} text-slate-500 dark:text-slate-400`}>
              Decode Emotions. Navigate Life.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
