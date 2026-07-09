/**
 * Minimal FIFO async semaphore. `run(fn)` waits for a free slot, runs `fn`, and
 * releases the slot even if `fn` throws. Used to bound concurrent PDF renders so
 * a burst of page views can't exhaust memory.
 */
export function createSemaphore(max: number) {
  const limit = Math.max(1, Math.floor(max));
  let active = 0;
  const waiters: Array<() => void> = [];

  const release = (): void => {
    active -= 1;
    const next = waiters.shift();
    if (next) {
      active += 1;
      next();
    }
  };

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) {
      await new Promise<void>((resolve) => waiters.push(resolve));
    } else {
      active += 1;
    }
    try {
      return await fn();
    } finally {
      release();
    }
  };
}
