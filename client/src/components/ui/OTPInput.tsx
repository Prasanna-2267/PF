import { useRef } from 'react';
import { cn } from '../../lib/cn';

/** Segmented numeric code entry (default 6 digits). Controlled via value/onChange. */
export function OTPInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  disabled = false,
  invalid = false,
  onComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onComplete?: (value: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split('').slice(0, length);

  const setAt = (index: number, char: string) => {
    const next = value.split('');
    next[index] = char;
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length && !joined.includes('') && onComplete) onComplete(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) return;
    setAt(index, char);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, '');
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
    if (pasted.length === length && onComplete) onComplete(pasted);
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={`${length}-digit code`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digits[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            'h-14 min-w-0 flex-1 rounded-field border bg-surface text-center text-xl font-bold text-fg tabular',
            'outline-none transition-[border-color,box-shadow] duration-150',
            'focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
            'disabled:opacity-55',
            invalid ? 'border-danger' : 'border-line',
          )}
        />
      ))}
    </div>
  );
}
