import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Skeleton, MegaphoneIcon, TelegramIcon } from '../../components/ui';
import { cn } from '../../lib/cn';
import { homeApi, type HomeInfo } from './home.api';

/** Admin-published announcements (rotating) + Telegram join buttons. */
export function HomeBanner({ className }: { className?: string }) {
  const q = useQuery({ queryKey: ['home', 'info'], queryFn: homeApi.get });
  const messages = q.data?.announcements ?? [];
  const [idx, setIdx] = useState(0);
  // Hover and focus pause independently — rotation resumes only when BOTH end.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const paused = hovered || focused;
  const autoRotating = messages.length > 1 && !paused && !reducedMotion;

  useEffect(() => {
    if (!autoRotating) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), 6000);
    return () => clearInterval(id);
  }, [autoRotating, messages.length]);

  if (q.isLoading) {
    return (
      <div className={className}>
        <Skeleton shape="block" className="h-20" />
      </div>
    );
  }
  if (!q.data) return null;

  const tg = q.data.telegram;
  const hasTg = Boolean(tg.groupUrl || tg.channelUrl);
  if (messages.length === 0 && !hasTg) return null;

  const activeIdx = messages.length ? idx % messages.length : 0;
  const current = messages.length ? messages[activeIdx] : null;

  return (
    <div className={cn('grid gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5', className)}>
      {current !== null ? (
        <Card
          className={cn(
            'pf-dots relative flex items-center gap-4 overflow-hidden bg-gradient-to-br from-primary-soft/30 to-transparent',
            hasTg ? 'lg:col-span-2' : 'lg:col-span-3',
          )}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
        >
          <span
            aria-hidden="true"
            className="pf-float pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl"
          />
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
            <MegaphoneIcon size={20} />
          </span>
          {/* Live only when NOT auto-rotating — otherwise screen readers would
              be interrupted every 6 seconds for as long as the page is open.
              Manual dot navigation (which pauses via focus) still announces. */}
          <div
            aria-live={autoRotating ? 'off' : 'polite'}
            className="relative flex min-h-12 min-w-0 flex-1 items-center"
          >
            <p
              key={activeIdx}
              className="animate-fade-in whitespace-pre-line text-sm font-medium leading-relaxed text-fg"
            >
              {current}
            </p>
          </div>
          {messages.length > 1 ? (
            <div className="relative flex shrink-0 items-center">
              {messages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show announcement ${i + 1} of ${messages.length}`}
                  aria-current={i === activeIdx}
                  onClick={() => setIdx(i)}
                  className="flex h-9 w-6 items-center justify-center"
                >
                  <span
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === activeIdx ? 'w-4 bg-primary' : 'w-1.5 bg-line',
                    )}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
      {hasTg ? <TelegramCard tg={tg} className={current !== null ? '' : 'lg:col-span-3'} /> : null}
    </div>
  );
}

function TelegramCard({ tg, className }: { tg: HomeInfo['telegram']; className?: string }) {
  return (
    <Card className={cn('flex flex-col justify-center gap-2.5', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        Join our community
      </p>
      {tg.groupUrl ? (
        <a
          href={tg.groupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pf-lift flex min-h-11 items-center justify-center gap-2 rounded-field bg-[#229ED9] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
        >
          <TelegramIcon size={17} /> Join Telegram Group
        </a>
      ) : null}
      {tg.channelUrl ? (
        <a
          href={tg.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pf-lift flex min-h-11 items-center justify-center gap-2 rounded-field border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg shadow-xs transition-colors hover:border-primary/40"
        >
          <TelegramIcon size={17} /> Join Telegram Channel
        </a>
      ) : null}
    </Card>
  );
}
