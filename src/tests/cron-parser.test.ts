import { describe, it, expect } from "vitest";
import { getNextRun, formatTimeUntil } from "../lib/cron-parser";

describe("getNextRun", () => {
	it("every 2 hours at :00 — next run is in the future", () => {
		const now = new Date("2026-02-24T03:30:00Z");
		const next = getNextRun("0 */2 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T04:00:00Z"));
	});

	it("every 2 hours at :00 — exactly on a run time", () => {
		const now = new Date("2026-02-24T04:00:00Z");
		const next = getNextRun("0 */2 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T06:00:00Z"));
	});

	it("every 4 hours at :30", () => {
		const now = new Date("2026-02-24T01:00:00Z");
		const next = getNextRun("30 */4 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T04:30:00Z"));
	});

	it("every hour at :00", () => {
		const now = new Date("2026-02-24T14:15:00Z");
		const next = getNextRun("0 */1 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T15:00:00Z"));
	});

	it("daily at 03:00 UTC — before 3am", () => {
		const now = new Date("2026-02-24T01:00:00Z");
		const next = getNextRun("0 3 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T03:00:00Z"));
	});

	it("daily at 03:00 UTC — after 3am wraps to next day", () => {
		const now = new Date("2026-02-24T04:00:00Z");
		const next = getNextRun("0 3 * * *", now);
		expect(next).toEqual(new Date("2026-02-25T03:00:00Z"));
	});

	it("every 6 hours at :00", () => {
		const now = new Date("2026-02-24T07:30:00Z");
		const next = getNextRun("0 */6 * * *", now);
		expect(next).toEqual(new Date("2026-02-24T12:00:00Z"));
	});
});

describe("formatTimeUntil", () => {
	it("formats minutes", () => {
		const now = new Date("2026-02-24T14:00:00Z");
		const target = new Date("2026-02-24T14:42:00Z");
		expect(formatTimeUntil(target, now)).toBe("42m");
	});

	it("formats hours and minutes", () => {
		const now = new Date("2026-02-24T14:00:00Z");
		const target = new Date("2026-02-24T16:30:00Z");
		expect(formatTimeUntil(target, now)).toBe("2h 30m");
	});

	it("formats exact hours", () => {
		const now = new Date("2026-02-24T14:00:00Z");
		const target = new Date("2026-02-24T16:00:00Z");
		expect(formatTimeUntil(target, now)).toBe("2h");
	});

	it("returns now for past targets", () => {
		const now = new Date("2026-02-24T14:00:00Z");
		const target = new Date("2026-02-24T13:00:00Z");
		expect(formatTimeUntil(target, now)).toBe("now");
	});
});
