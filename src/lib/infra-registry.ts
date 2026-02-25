import type { InfraConfig } from "./types";

export const INFRA: InfraConfig[] = [
	// === SERVER ROOM ROW 1 (y=500): Databases + Storage ===
	{
		id: "d1-spoolprices",
		type: "d1",
		name: "spoolprices_db",
		project: "spoolprices.com",
		position: { x: 166, y: 500 },
		size: "~50MB",
		detail: "Products, listings, price_history, alerts, scrape_errors (6 migrations)",
		color: "#ef7d57",
	},
	{
		id: "d1-oncstrata",
		type: "d1",
		name: "oncstrata-faers",
		project: "oncstrata",
		position: { x: 346, y: 500 },
		size: "~350MB",
		detail: "57 tables, 21 migrations. Trials, pubs, FAERS, drug labels, KOL, NCCN.",
		color: "#0d9488",
	},
	{
		id: "d1-nieltran",
		type: "d1",
		name: "nieltran-db",
		project: "nieltran.com",
		position: { x: 526, y: 500 },
		size: "~100MB",
		detail: "KOL providers/payments, NCCN guidelines, sessions, CI data.",
		color: "#3f8efc",
	},
	{
		id: "d1-npi",
		type: "d1",
		name: "npi_db",
		project: "nieltran.com",
		position: { x: 706, y: 500 },
		size: "1.6GB",
		detail: "9.35M-row NPPES mirror. Full US provider registry. Read-only source.",
		color: "#64748b",
	},
	{
		id: "r2-images",
		type: "r2",
		name: "spoolprices-images",
		project: "spoolprices.com",
		position: { x: 886, y: 500 },
		size: "~496 WebP images",
		detail: "Product images at images.spoolprices.com. 400px WebP compressed.",
		color: "#ef7d57",
	},

	// === SERVER ROOM ROW 2 (y=610): Cache + Queues + AI ===
	{
		id: "kv-spoolprices",
		type: "kv",
		name: "CACHE (SpoolPrices)",
		project: "spoolprices.com",
		position: { x: 116, y: 610 },
		size: "~500 keys",
		detail: "cron:last-run, cache:version, api:prices:*, exchange-rates, purge:*",
		color: "#ef7d57",
	},
	{
		id: "kv-oncstrata",
		type: "kv",
		name: "CACHE (OncStrata)",
		project: "oncstrata",
		position: { x: 296, y: 610 },
		size: "~200 keys",
		detail: "3 TTL tiers (1h/6h/24h). kol:data:v2, API cache keys.",
		color: "#0d9488",
	},
	{
		id: "kv-session",
		type: "kv",
		name: "SESSION (nieltran)",
		project: "nieltran.com",
		position: { x: 476, y: 610 },
		size: "~100 keys",
		detail: "Session tokens (1h TTL), kol:data:v2 cache.",
		color: "#3f8efc",
	},
	{
		id: "queue-check",
		type: "queue",
		name: "check-queue",
		project: "spoolprices.com",
		position: { x: 656, y: 610 },
		size: "10/batch, 3 retries",
		detail: "Product price check queue. 30s timeout per message.",
		color: "#ef7d57",
	},
	{
		id: "queue-dlq",
		type: "queue",
		name: "DLQ",
		project: "spoolprices.com",
		position: { x: 836, y: 610 },
		size: "Dead letter queue",
		detail: "Max-retry failures. Logs to scrape_errors D1 table.",
		color: "#ef4444",
	},
	{
		id: "ai-terminal",
		type: "ai",
		name: "Workers AI",
		project: "oncstrata",
		position: { x: 1016, y: 610 },
		size: "10K neurons/day",
		detail: "Llama 3.3 70B FP8 Fast. Generates daily competitive briefs per indication.",
		color: "#facc15",
	},
];

export function getInfra(id: string): InfraConfig | undefined {
	return INFRA.find((i) => i.id === id);
}

export function getInfraForProject(project: string): InfraConfig[] {
	return INFRA.filter((i) => i.project === project);
}
