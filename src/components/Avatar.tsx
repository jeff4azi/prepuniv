import type { ImgHTMLAttributes } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  name: string;
  src?: string;
  size?: Size;
  ring?: boolean;
}

const SIZE_MAP: Record<Size, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const BG_COLORS = [
  'bg-primary/80',
  'bg-secondary',
  'bg-muted',
];

function hashString(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function Avatar({ name, src, size = 'md', ring = false, className = '', alt, ...props }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const bgIndex = hashString(name) % BG_COLORS.length;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl overflow-hidden font-heading font-semibold text-cream ${SIZE_MAP[size]} ${ring ? 'ring-2 ring-cream shadow-soft' : ''} ${BG_COLORS[bgIndex]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          className="h-full w-full object-cover"
          {...props}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
