export type SolarPhase = "night" | "dawn" | "day" | "dusk";
export type DayPhase = SolarPhase;

export interface ZonedClock {
  timeZone: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  localMinutes: number;
  dayOfYear: number;
}

export interface SolarLightingState {
  phase: SolarPhase;
  localMinutes: number;
  dayOfYear: number;
  resolvedTimeZone: string;
  sunProgress: number;
  sunHeight: number;
  daylight: number;
  artificialLight: number;
  twilight: number;
  sunriseMinutes: number;
  sunsetMinutes: number;
}

const FALLBACK_TIME_ZONE = "UTC";
const MINUTES_PER_DAY = 24 * 60;
const SOLAR_NOON_MINUTES = 12 * 60;
const TWILIGHT_MINUTES = 75;
const DEFAULT_DAY_OF_YEAR = 80;

const clockFormatters = new Map<string, Intl.DateTimeFormat>();

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const progress = clamp01((value - edge0) / (edge1 - edge0));
  return progress * progress * (3 - 2 * progress);
}

function normalizeLocalMinutes(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function normalizeDayOfYear(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_DAY_OF_YEAR;
  }

  return Math.min(366, Math.max(1, value));
}

function assertValidDate(date: Date): void {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new RangeError("A valid Date is required.");
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function calculateDayOfYear(year: number, month: number, day: number): number {
  const monthOffsets = isLeapYear(year)
    ? [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]
    : [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  return monthOffsets[month - 1] + day;
}

function getClockFormatter(timeZone: string): Intl.DateTimeFormat {
  const existing = clockFormatters.get(timeZone);
  if (existing) {
    return existing;
  }

  const formatter = new Intl.DateTimeFormat(
    "en-US-u-ca-gregory-nu-latn",
    {
      timeZone,
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
  );
  clockFormatters.set(timeZone, formatter);
  return formatter;
}

function partNumber(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = parts.find((part) => part.type === type)?.value;
  const parsed = value === undefined ? Number.NaN : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new RangeError(`Unable to read zoned date part: ${type}.`);
  }

  return parsed;
}

export function resolveTimeZone(timeZone: string): string {
  if (typeof timeZone !== "string" || timeZone.trim() === "") {
    return FALLBACK_TIME_ZONE;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone.trim(),
    }).resolvedOptions().timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

export function getZonedClock(date: Date, timeZone: string): ZonedClock {
  assertValidDate(date);

  const resolvedTimeZone = resolveTimeZone(timeZone);
  const parts = getClockFormatter(resolvedTimeZone).formatToParts(date);
  const year = partNumber(parts, "year");
  const month = partNumber(parts, "month");
  const day = partNumber(parts, "day");
  const hour = partNumber(parts, "hour");
  const minute = partNumber(parts, "minute");
  const second = partNumber(parts, "second");

  return {
    timeZone: resolvedTimeZone,
    year,
    month,
    day,
    hour,
    minute,
    second,
    localMinutes: hour * 60 + minute + second / 60,
    dayOfYear: calculateDayOfYear(year, month, day),
  };
}

function calculateSolarLightingState(
  localMinutes: number,
  dayOfYear: number,
  resolvedTimeZone: string,
): SolarLightingState {
  const minutes = normalizeLocalMinutes(localMinutes);
  const seasonalDay = normalizeDayOfYear(dayOfYear);

  // Time zone alone cannot reveal latitude or hemisphere, so this is a
  // consistent local-time visual clock rather than an astronomical ephemeris.
  const daylightDuration = 12 * 60;
  const sunriseMinutes = SOLAR_NOON_MINUTES - daylightDuration / 2;
  const sunsetMinutes = SOLAR_NOON_MINUTES + daylightDuration / 2;
  const dawnStart = sunriseMinutes - TWILIGHT_MINUTES;
  const duskEnd = sunsetMinutes + TWILIGHT_MINUTES;

  let phase: SolarPhase;
  if (minutes < dawnStart || minutes >= duskEnd) {
    phase = "night";
  } else if (minutes < sunriseMinutes) {
    phase = "dawn";
  } else if (minutes < sunsetMinutes) {
    phase = "day";
  } else {
    phase = "dusk";
  }

  const sunProgress = clamp01(
    (minutes - sunriseMinutes) / daylightDuration,
  );
  const sunHeight =
    minutes >= sunriseMinutes && minutes <= sunsetMinutes
      ? clamp01(Math.sin(Math.PI * sunProgress))
      : 0;
  const horizonDistance = Math.min(
    Math.abs(minutes - sunriseMinutes),
    Math.abs(minutes - sunsetMinutes),
  );
  const twilight =
    horizonDistance < TWILIGHT_MINUTES
      ? 1 - smoothstep(0, TWILIGHT_MINUTES, horizonDistance)
      : 0;
  const daylight = clamp01(
    Math.max(Math.pow(sunHeight, 0.55), twilight * 0.28),
  );
  const artificialLight =
    1 - smoothstep(0.05, 0.65, daylight);

  return {
    phase,
    localMinutes: minutes,
    dayOfYear: seasonalDay,
    resolvedTimeZone,
    sunProgress,
    sunHeight,
    daylight,
    artificialLight,
    twilight,
    sunriseMinutes,
    sunsetMinutes,
  };
}

export function getSolarLightingStateForLocalMinutes(
  localMinutes: number,
  dayOfYear = DEFAULT_DAY_OF_YEAR,
): SolarLightingState {
  return calculateSolarLightingState(
    localMinutes,
    dayOfYear,
    FALLBACK_TIME_ZONE,
  );
}

export function getSolarLightingState(
  date: Date,
  timeZone: string,
): SolarLightingState {
  const clock = getZonedClock(date, timeZone);
  return calculateSolarLightingState(
    clock.localMinutes,
    clock.dayOfYear,
    clock.timeZone,
  );
}

export function formatZonedTime(
  date: Date,
  timeZone: string,
  locale = "en-GB",
): string {
  assertValidDate(date);

  const resolvedTimeZone = resolveTimeZone(timeZone);
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: resolvedTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: resolvedTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  }
}
