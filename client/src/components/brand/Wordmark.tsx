import { cn } from '../../lib/cn';
import { EyeMark } from './EyeMark';

export type WordmarkSize = 'sm' | 'md' | 'lg';

const textSize: Record<WordmarkSize, string> = {
  sm: 'text-[15px]',
  md: 'text-lg',
  lg: 'text-2xl',
};
const markSize: Record<WordmarkSize, number> = { sm: 20, md: 24, lg: 30 };

/** Theme-aware brand lockup (eye mark + wordmark). Inherits brand color. */
export function Wordmark({
  size = 'md',
  withMark = true,
  className,
}: {
  size?: WordmarkSize;
  withMark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-brand', className)}>
      {withMark ? <EyeMark size={markSize[size]} /> : null}
      <span className={cn('font-display font-extrabold leading-none tracking-tight', textSize[size])}>
        Parallax&nbsp;Flow
      </span>
    </span>
  );
}
