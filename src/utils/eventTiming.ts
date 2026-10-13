/**
 * Event timing utilities for CampusPulse
 * Computes Ongoing, Upcoming, and Past statuses strictly in the user's local timezone.
 */

export type EventTimeStatus = 'ongoing' | 'upcoming' | 'past';

export interface EventTimingInfo {
  status: EventTimeStatus;
  isOngoing: boolean;
  isUpcoming: boolean;
  isPast: boolean;
  countdownText: string | null;
  startDate: Date;
  endDate: Date;
}

/**
 * Parses event date string ("YYYY-MM-DD" or ISO) and time string ("09:00 AM", "2:30 PM", "14:00")
 * into a local Date object.
 */
export function parseEventDateTime(dateStr: string, timeStr?: string): Date {
  if (!dateStr) return new Date();

  // Safely extract year, month, day in local numbers
  const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = (parseInt(parts[1], 10) || 1) - 1;
  const day = parseInt(parts[2], 10) || 1;

  let hours = 0;
  let minutes = 0;

  if (timeStr && typeof timeStr === 'string') {
    const raw = timeStr.trim().toUpperCase();
    const isPM = raw.includes('PM');
    const isAM = raw.includes('AM');
    const cleanTime = raw.replace(/[APM\s]/g, '');
    const [hPart, mPart] = cleanTime.split(':');
    let h = parseInt(hPart, 10) || 0;
    const m = parseInt(mPart, 10) || 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    hours = Math.min(23, Math.max(0, h));
    minutes = Math.min(59, Math.max(0, m));
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
}

/**
 * Calculates whether an event is Ongoing, Upcoming, or Past, plus countdown text for upcoming events within 7 days.
 */
export function getEventTimingInfo(event: {
  date: string;
  start_time?: string;
  end_time?: string;
}): EventTimingInfo {
  const now = new Date();
  const startDate = parseEventDateTime(event.date, event.start_time || '00:00');

  let endDate: Date;
  if (event.end_time) {
    endDate = parseEventDateTime(event.date, event.end_time);
    // Overnight handling: if end time <= start time, event concludes on the following day
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    // Default 3 hours duration if no end time specified
    endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
  }

  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  let status: EventTimeStatus = 'upcoming';

  if (nowMs >= startMs && nowMs <= endMs) {
    status = 'ongoing';
  } else if (nowMs > endMs) {
    status = 'past';
  } else {
    status = 'upcoming';
  }

  let countdownText: string | null = null;

  if (status === 'upcoming') {
    const diffMs = startMs - nowMs;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (diffMs > 0 && diffMs <= sevenDaysMs) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 60) {
        countdownText = `Starts in ${Math.max(1, diffMinutes)}m`;
      } else if (diffHours < 24) {
        countdownText = `Starts in ${diffHours}h`;
      } else if (diffDays === 1) {
        countdownText = 'Starts tomorrow';
      } else {
        countdownText = `Starts in ${diffDays} days`;
      }
    }
  }

  return {
    status,
    isOngoing: status === 'ongoing',
    isUpcoming: status === 'upcoming',
    isPast: status === 'past',
    countdownText,
    startDate,
    endDate,
  };
}
