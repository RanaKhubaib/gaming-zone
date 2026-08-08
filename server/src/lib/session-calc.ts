/**
 * Pricing helpers for sessions.
 *
 * - Station hourlyRate is the per-hour price (e.g. 300).
 * - minBillableHours: never charge less than this many hours (default 1 → min = 1 × rate).
 * - roundUpToFullHours: bill in whole hours (ceil), e.g. 61m → 2 hours.
 */

export type PricingOptions = {
  minBillableHours?: number;
  roundUpToFullHours?: boolean;
};

const DEFAULT_PRICING: Required<PricingOptions> = {
  minBillableHours: 1,
  roundUpToFullHours: true,
};

export function calculatePriceFromMinutes(
  durationMinutes: number,
  hourlyRate: number,
  options: PricingOptions = {}
): number {
  const minHours = Math.max(0, options.minBillableHours ?? DEFAULT_PRICING.minBillableHours);
  const roundUp = options.roundUpToFullHours ?? DEFAULT_PRICING.roundUpToFullHours;

  const rawHours = Math.max(0, durationMinutes) / 60;
  let billableHours = rawHours;

  if (roundUp) {
    // Less than a second of play still counts as the minimum block once started
    billableHours = rawHours <= 0 ? 0 : Math.ceil(rawHours - 1e-9);
  }

  billableHours = Math.max(billableHours, minHours);
  const price = billableHours * hourlyRate;
  return Math.round(price * 100) / 100;
}

/**
 * Duration in minutes and price from times + hourly rate + shop pricing rules.
 */
export function calculateSessionMetrics(
  startTime: Date,
  endTime: Date | null | undefined,
  hourlyRate: number,
  options: PricingOptions = {}
): { durationMinutes: number | null; price: number | null } {
  if (!endTime) {
    return { durationMinutes: null, price: null };
  }

  const ms = endTime.getTime() - startTime.getTime();
  if (ms < 0) {
    return { durationMinutes: 0, price: 0 };
  }

  const durationMinutes = ms / (1000 * 60);
  const price = calculatePriceFromMinutes(durationMinutes, hourlyRate, options);

  return {
    durationMinutes: Math.round(durationMinutes * 100) / 100,
    price,
  };
}

/** Live running metrics while a timer session is active */
export function calculateRunningMetrics(
  startTime: Date,
  hourlyRate: number,
  now: Date = new Date(),
  options: PricingOptions = {}
): { durationMinutes: number; price: number } {
  const ms = Math.max(0, now.getTime() - startTime.getTime());
  const durationMinutes = ms / (1000 * 60);
  const price = calculatePriceFromMinutes(durationMinutes, hourlyRate, options);
  return {
    durationMinutes: Math.round(durationMinutes * 100) / 100,
    price,
  };
}

export function getDisplayGameName(session: {
  gameNameFreeText?: string | null;
  game?: { name: string } | null;
}): string {
  return session.game?.name || session.gameNameFreeText || "—";
}

/** Price for a timer session based on booked hours × station rate */
export function priceFromBookedHours(
  bookedHours: number,
  hourlyRate: number
): number {
  return Math.round(Math.max(0, bookedHours) * hourlyRate * 100) / 100;
}

/** Countdown remaining (can be negative when overtime) */
export function getCountdownRemainingMs(
  startTime: Date,
  bookedHours: number,
  now: Date = new Date()
): number {
  const endsAt = startTime.getTime() + bookedHours * 60 * 60 * 1000;
  return endsAt - now.getTime();
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatOvertime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `+${m}:${String(s).padStart(2, "0")}`;
}

