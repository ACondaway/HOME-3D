import assert from "node:assert/strict";
import test from "node:test";

const solarLighting = (await import(
  new URL("../app/solar-lighting.ts", import.meta.url).href
)) as typeof import("../app/solar-lighting");

const {
  formatZonedTime,
  getSolarLightingState,
  getSolarLightingStateForLocalMinutes,
  getZonedClock,
  resolveTimeZone,
} = solarLighting;

test("maps fixed UTC instants to Shanghai noon and midnight", () => {
  const noon = new Date("2026-06-21T04:00:00.000Z");
  const midnight = new Date("2026-06-21T16:00:00.000Z");

  const noonClock = getZonedClock(noon, "Asia/Shanghai");
  const midnightClock = getZonedClock(midnight, "Asia/Shanghai");
  const noonState = getSolarLightingState(noon, "Asia/Shanghai");
  const midnightState = getSolarLightingState(midnight, "Asia/Shanghai");

  assert.equal(noonClock.hour, 12);
  assert.equal(noonClock.localMinutes, 720);
  assert.equal(midnightClock.hour, 0);
  assert.equal(midnightClock.day, 22);
  assert.equal(midnightClock.localMinutes, 0);
  assert.equal(noonState.phase, "day");
  assert.ok(noonState.sunHeight > 0.99);
  assert.equal(midnightState.phase, "night");
  assert.equal(midnightState.sunHeight, 0);
  assert.equal(formatZonedTime(noon, "Asia/Shanghai", "en-GB"), "12:00");
});

test("uses the New York DST offset on both sides of the spring transition", () => {
  const before = getZonedClock(
    new Date("2026-03-08T06:30:00.000Z"),
    "America/New_York",
  );
  const after = getZonedClock(
    new Date("2026-03-08T07:30:00.000Z"),
    "America/New_York",
  );
  const summer = getZonedClock(
    new Date("2026-07-15T16:34:56.000Z"),
    "America/New_York",
  );

  assert.deepEqual([before.hour, before.minute], [1, 30]);
  assert.deepEqual([after.hour, after.minute], [3, 30]);
  assert.deepEqual(
    [summer.hour, summer.minute, summer.second],
    [12, 34, 56],
  );
});

test("falls back to UTC for an empty or invalid IANA time zone", () => {
  const date = new Date("2026-02-03T04:05:06.000Z");

  assert.equal(resolveTimeZone(""), "UTC");
  assert.equal(resolveTimeZone("Mars/Olympus_Mons"), "UTC");

  const invalidClock = getZonedClock(date, "Mars/Olympus_Mons");
  const utcClock = getZonedClock(date, "UTC");
  const invalidState = getSolarLightingState(date, "Mars/Olympus_Mons");

  assert.deepEqual(invalidClock, utcClock);
  assert.equal(invalidState.resolvedTimeZone, "UTC");
  assert.equal(formatZonedTime(date, "Mars/Olympus_Mons"), "04:05");
});

test("normalizes supported GMT and UTC fixed-offset labels", () => {
  assert.equal(resolveTimeZone("GMT+8"), "GMT+8");
  assert.equal(resolveTimeZone("GMT+08:00"), "GMT+8");
  assert.equal(resolveTimeZone("UTC-5"), "GMT-5");
  assert.equal(resolveTimeZone(" UTC + 5 : 30 "), "GMT+5:30");
  assert.equal(resolveTimeZone("gmt - 03 : 30"), "GMT-3:30");
});

test("applies positive, negative, and half-hour offsets across dates", () => {
  const positive = getZonedClock(
    new Date("2026-12-31T18:15:30.000Z"),
    "GMT+08:00",
  );
  const negative = getZonedClock(
    new Date("2026-01-01T03:15:00.000Z"),
    "UTC-5",
  );
  const halfHour = getZonedClock(
    new Date("2026-01-01T06:45:00.000Z"),
    "UTC+5:30",
  );

  assert.deepEqual(
    [
      positive.timeZone,
      positive.year,
      positive.month,
      positive.day,
      positive.hour,
      positive.minute,
      positive.second,
      positive.dayOfYear,
    ],
    ["GMT+8", 2027, 1, 1, 2, 15, 30, 1],
  );
  assert.deepEqual(
    [
      negative.timeZone,
      negative.year,
      negative.month,
      negative.day,
      negative.hour,
      negative.minute,
      negative.dayOfYear,
    ],
    ["GMT-5", 2025, 12, 31, 22, 15, 365],
  );
  assert.deepEqual(
    [halfHour.timeZone, halfHour.hour, halfHour.minute, halfHour.localMinutes],
    ["GMT+5:30", 12, 15, 735],
  );
});

test("formats and lights fixed-offset clocks from the same local time", () => {
  const instant = new Date("2026-06-21T04:00:00.000Z");
  const shanghaiLike = getSolarLightingState(instant, "GMT+8");
  const western = getSolarLightingState(instant, "UTC-5");

  assert.equal(formatZonedTime(instant, "GMT+08:00"), "12:00");
  assert.equal(formatZonedTime(instant, "UTC-5"), "23:00");
  assert.equal(shanghaiLike.resolvedTimeZone, "GMT+8");
  assert.equal(shanghaiLike.localMinutes, 12 * 60);
  assert.equal(shanghaiLike.phase, "day");
  assert.equal(western.resolvedTimeZone, "GMT-5");
  assert.equal(western.localMinutes, 23 * 60);
  assert.equal(western.phase, "night");
  assert.ok(shanghaiLike.daylight > western.daylight);
  assert.ok(western.artificialLight > shanghaiLike.artificialLight);
});

test("rejects out-of-range or malformed fixed offsets", () => {
  const date = new Date("2026-02-03T04:05:06.000Z");

  for (const invalid of [
    "GMT+14:01",
    "UTC-14:30",
    "GMT+15",
    "GMT+5:60",
    "UTC--5",
  ]) {
    assert.equal(resolveTimeZone(invalid), "UTC");
    assert.deepEqual(getZonedClock(date, invalid), getZonedClock(date, "UTC"));
  }
});

test("keeps all scene-driving light values normalized", () => {
  const phases = new Set(["night", "dawn", "day", "dusk"]);

  for (const dayOfYear of [1, 80, 172, 266, 355, 366]) {
    for (let localMinutes = 0; localMinutes < 1440; localMinutes += 15) {
      const state = getSolarLightingStateForLocalMinutes(
        localMinutes,
        dayOfYear,
      );

      assert.ok(phases.has(state.phase));
      assert.ok(state.localMinutes >= 0 && state.localMinutes < 1440);
      for (const value of [
        state.sunProgress,
        state.sunHeight,
        state.daylight,
        state.artificialLight,
        state.twilight,
      ]) {
        assert.ok(value >= 0 && value <= 1);
      }
    }
  }
});

test("keeps the time-zone-only sun arc neutral to latitude and hemisphere", () => {
  for (const dayOfYear of [1, 80, 172, 266, 355, 366]) {
    const state = getSolarLightingStateForLocalMinutes(
      12 * 60,
      dayOfYear,
    );

    assert.equal(state.sunriseMinutes, 6 * 60);
    assert.equal(state.sunsetMinutes, 18 * 60);
    assert.equal(state.sunHeight, 1);
  }
});

test("brightens artificial lights at night and peaks twilight at the horizon", () => {
  const midnight = getSolarLightingStateForLocalMinutes(0, 80);
  const sunrise = getSolarLightingStateForLocalMinutes(6 * 60, 80);
  const noon = getSolarLightingStateForLocalMinutes(12 * 60, 80);

  assert.equal(midnight.phase, "night");
  assert.equal(midnight.daylight, 0);
  assert.equal(midnight.artificialLight, 1);
  assert.equal(sunrise.twilight, 1);
  assert.equal(noon.twilight, 0);
  assert.ok(noon.daylight > sunrise.daylight);
  assert.ok(midnight.artificialLight > sunrise.artificialLight);
  assert.ok(sunrise.artificialLight > noon.artificialLight);
});
