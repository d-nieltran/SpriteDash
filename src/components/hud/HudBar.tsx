import { useEffect, useState } from "react";
import { WORKERS } from "@/lib/worker-registry";
import { getNextRun, formatTimeUntil } from "@/lib/cron-parser";

export function HudBar() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const nextEvent = getNextEvent(time);

	return (
		<div className="hud-bar glass">
			<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
				<div className="hud-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a78bfa" }}>
						<rect x="2" y="3" width="20" height="14" rx="2" />
						<path d="M8 21h8" />
						<path d="M12 17v4" />
						<circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none" />
						<circle cx="16" cy="10" r="1.5" fill="currentColor" stroke="none" />
					</svg>
					<span style={{ color: "rgba(255,255,255,0.85)" }}>SpriteDash</span>
				</div>

				<div className="hud-clock">
					{time.toLocaleTimeString("en-US", {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						timeZone: "UTC",
					})}{" "}
					<span style={{ opacity: 0.5 }}>UTC</span>
				</div>

				{nextEvent && (
					<div className="hud-next">
						Next:{" "}
						<strong style={{ color: nextEvent.color }}>
							{nextEvent.name}
						</strong>{" "}
						in {nextEvent.timeUntil}
					</div>
				)}
			</div>

			<div className="hud-legend">
				<div className="hud-legend-item">
					<div className="hud-legend-dot" style={{ background: "#94a3b8" }} />
					idle
				</div>
				<div className="hud-legend-item">
					<div className="hud-legend-dot" style={{ background: "#22c55e" }} />
					working
				</div>
				<div className="hud-legend-item">
					<div className="hud-legend-dot" style={{ background: "#ef4444" }} />
					error
				</div>
			</div>
		</div>
	);
}

function getNextEvent(now: Date) {
	let earliest: { name: string; color: string; time: Date } | null = null;

	for (const worker of WORKERS) {
		const next = getNextRun(worker.cron, now);
		if (!earliest || next < earliest.time) {
			earliest = {
				name: worker.character,
				color: worker.color,
				time: next,
			};
		}
	}

	if (!earliest) return null;
	return {
		name: earliest.name,
		color: earliest.color,
		timeUntil: formatTimeUntil(earliest.time, now),
	};
}
