/**
 * Day bucketing in the app's fixed reporting timezone (IST / Asia/Kolkata).
 *
 * The whole product is India-focused, so "today", streaks, daily totals, the
 * heatmap and admin charts must roll over at IST midnight — NOT UTC midnight
 * (which is 05:30 IST and silently splits late-night study sessions across two
 * buckets). IST has no DST, so the offset is a constant +05:30.
 */
export const IST_TIMEZONE = 'Asia/Kolkata';

// en-CA formats as YYYY-MM-DD, which sorts lexicographically = chronologically.
const IST_DAY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar day (YYYY-MM-DD) of an instant, in IST. */
export function istDayKey(d: Date = new Date()): string {
  return IST_DAY_FMT.format(d);
}

/** The instant of IST-midnight that begins the current IST day. */
export function istStartOfToday(): Date {
  return new Date(`${istDayKey()}T00:00:00+05:30`);
}
