/**
 * Minimal cron parser for the specific patterns used by our 5 workers.
 * Supports: "0 *\/N * * *", "M *\/N * * *", "0 H * * *"
 */
export function getNextRun(cron: string, now: Date = new Date()): Date {
	const parts = cron.split(" ");
	if (parts.length !== 5) throw new Error(`Invalid cron: ${cron}`);

	const [minute, hour] = parts;
	const nowMinute = now.getUTCMinutes();
	const nowHour = now.getUTCHours();

	// "0 3 * * *" — daily at specific hour
	if (!hour.includes("/") && !hour.includes("*")) {
		const targetHour = Number.parseInt(hour, 10);
		const targetMinute = Number.parseInt(minute, 10);
		const next = new Date(now);
		next.setUTCSeconds(0, 0);
		next.setUTCMinutes(targetMinute);
		next.setUTCHours(targetHour);
		if (next <= now) {
			next.setUTCDate(next.getUTCDate() + 1);
		}
		return next;
	}

	// "0 */N * * *" or "M */N * * *" — every N hours at minute M
	const stepMatch = hour.match(/^\*\/(\d+)$/);
	if (stepMatch) {
		const step = Number.parseInt(stepMatch[1], 10);
		const targetMinute = Number.parseInt(minute, 10);

		const next = new Date(now);
		next.setUTCSeconds(0, 0);
		next.setUTCMinutes(targetMinute);

		// Find the next hour that's a multiple of step
		let nextHour = Math.ceil(nowHour / step) * step;
		if (nextHour === nowHour && nowMinute >= targetMinute) {
			nextHour += step;
		}
		if (nextHour >= 24) {
			next.setUTCDate(next.getUTCDate() + 1);
			nextHour = nextHour % 24;
		}
		next.setUTCHours(nextHour);
		return next;
	}

	// Fallback: return 1 hour from now
	return new Date(now.getTime() + 60 * 60 * 1000);
}

export function formatTimeUntil(target: Date, now: Date = new Date()): string {
	const diffMs = target.getTime() - now.getTime();
	if (diffMs <= 0) return "now";

	const minutes = Math.floor(diffMs / 60000);
	if (minutes < 60) return `${minutes}m`;

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (hours < 24) {
		return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
	}

	return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
