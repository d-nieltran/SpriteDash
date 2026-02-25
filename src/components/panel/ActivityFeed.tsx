import { useEffect, useRef, useState } from "react";

export interface ActivityEvent {
	id: number;
	text: string;
	time: number;
}

interface ActivityFeedProps {
	events: ActivityEvent[];
}

const MAX_EVENTS = 5;
const FADE_AFTER = 15_000; // 15s

export function ActivityFeed({ events }: ActivityFeedProps) {
	const [, setTick] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval>>();

	// Re-render every 2s to update fading
	useEffect(() => {
		timerRef.current = setInterval(() => setTick((t) => t + 1), 2000);
		return () => clearInterval(timerRef.current);
	}, []);

	const now = Date.now();
	const visible = events.slice(-MAX_EVENTS).filter((e) => now - e.time < FADE_AFTER * 2);

	if (visible.length === 0) return null;

	return (
		<div className="activity-feed">
			{visible.map((e) => {
				const age = now - e.time;
				const opacity = age > FADE_AFTER ? Math.max(0, 1 - (age - FADE_AFTER) / FADE_AFTER) : 1;
				const timeAgo = age < 5000 ? "now" : `${Math.floor(age / 1000)}s ago`;

				return (
					<div
						key={e.id}
						className="activity-item"
						style={{ opacity }}
					>
						<span className="activity-dot" />
						<span className="activity-text">{e.text}</span>
						<span className="activity-time">{timeAgo}</span>
					</div>
				);
			})}
		</div>
	);
}
