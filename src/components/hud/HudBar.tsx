import { useEffect, useState } from "react";
import { WORKERS } from "@/lib/worker-registry";
import { getNextRun, formatTimeUntil } from "@/lib/cron-parser";

const STATUS_COLORS: Record<string, string> = {
	idle: "bg-slate-400",
	working: "bg-green-400",
	error: "bg-red-400",
};

export function HudBar() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const nextEvent = getNextEvent(time);

	return (
		<div className="absolute top-0 left-0 right-0 h-[60px] bg-[#0f1117]/90 border-b border-[#38394b] flex items-center justify-between px-6 font-mono text-xs text-white z-10">
			<div className="flex items-center gap-6">
				<span className="text-slate-400">
					{time.toLocaleTimeString("en-US", {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						timeZone: "UTC",
					})}{" "}
					UTC
				</span>

				{nextEvent && (
					<span className="text-slate-300">
						Next:{" "}
						<span style={{ color: nextEvent.color }}>
							{nextEvent.name}
						</span>{" "}
						in {nextEvent.timeUntil}
					</span>
				)}
			</div>

			<div className="flex items-center gap-4">
				{Object.entries(STATUS_COLORS).map(([status, bg]) => (
					<div key={status} className="flex items-center gap-1.5">
						<div className={`w-2 h-2 rounded-full ${bg}`} />
						<span className="text-slate-500 capitalize">{status}</span>
					</div>
				))}

				<span className="text-slate-600 ml-2">SpriteDash</span>
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
