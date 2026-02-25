import { useEffect, useState } from "react";
import type { StatusResponse } from "./types";

const POLL_INTERVAL = 30_000;

export function useWorkerStatus(): StatusResponse | null {
	const [data, setData] = useState<StatusResponse | null>(null);

	useEffect(() => {
		let active = true;

		const fetchStatus = async () => {
			try {
				const res = await fetch("/api/status");
				if (res.ok && active) {
					setData(await res.json());
				}
			} catch {
				// Silently fail — dashboard shows last known state
			}
		};

		fetchStatus();
		const id = setInterval(fetchStatus, POLL_INTERVAL);
		return () => {
			active = false;
			clearInterval(id);
		};
	}, []);

	return data;
}
