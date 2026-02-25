import type { InfraConfig } from "./types";

export const INFRA: InfraConfig[] = [
	// D1 Databases — bottom wall (server room)
	{
		id: "d1-spoolprices",
		type: "d1",
		name: "spoolprices_db",
		project: "spoolprices.com",
		position: { x: 100, y: 580 },
		size: "~50MB",
		detail: "Products, listings, price_history, alerts, scrape_errors (6 migrations)",
		color: "#ef7d57",
	},
	{
		id: "d1-oncstrata",
		type: "d1",
		name: "oncstrata-faers",
		project: "oncstrata",
		position: { x: 280, y: 580 },
		size: "~350MB",
		detail: "57 tables, 21 migrations. Trials, pubs, FAERS, drug labels, KOL, NCCN.",
		color: "#0d9488",
	},
	{
		id: "d1-nieltran",
		type: "d1",
		name: "nieltran-db",
		project: "nieltran.com",
		position: { x: 460, y: 580 },
		size: "~100MB",
		detail: "KOL providers/payments, NCCN guidelines, sessions, CI data.",
		color: "#3f8efc",
	},
	{
		id: "d1-npi",
		type: "d1",
		name: "npi_db",
		project: "nieltran.com",
		position: { x: 640, y: 580 },
		size: "1.6GB",
		detail: "9.35M-row NPPES mirror. Full US provider registry. Read-only source.",
		color: "#64748b",
	},

	// R2 Bucket — bottom wall
	{
		id: "r2-images",
		type: "r2",
		name: "spoolprices-images",
		project: "spoolprices.com",
		position: { x: 820, y: 580 },
		size: "~496 WebP images",
		detail: "Product images at images.spoolprices.com. 400px WebP compressed.",
		color: "#ef7d57",
	},

	// KV Namespaces — left wall
	{
		id: "kv-spoolprices",
		type: "kv",
		name: "CACHE (SpoolPrices)",
		project: "spoolprices.com",
		position: { x: 20, y: 160 },
		size: "~500 keys",
		detail: "cron:last-run, cache:version, api:prices:*, exchange-rates, purge:*",
		color: "#ef7d57",
	},
	{
		id: "kv-oncstrata",
		type: "kv",
		name: "CACHE (OncStrata)",
		project: "oncstrata",
		position: { x: 20, y: 280 },
		size: "~200 keys",
		detail: "3 TTL tiers (1h/6h/24h). kol:data:v2, API cache keys.",
		color: "#0d9488",
	},
	{
		id: "kv-session",
		type: "kv",
		name: "SESSION (nieltran)",
		project: "nieltran.com",
		position: { x: 20, y: 400 },
		size: "~100 keys",
		detail: "Session tokens (1h TTL), kol:data:v2 cache.",
		color: "#3f8efc",
	},

	// Queues — left wall, lower
	{
		id: "queue-check",
		type: "queue",
		name: "check-queue",
		project: "spoolprices.com",
		position: { x: 20, y: 520 },
		size: "10/batch, 3 retries",
		detail: "Product price check queue. 30s timeout per message.",
		color: "#ef7d57",
	},
	{
		id: "queue-dlq",
		type: "queue",
		name: "DLQ",
		project: "spoolprices.com",
		position: { x: 120, y: 520 },
		size: "Dead letter queue",
		detail: "Max-retry failures. Logs to scrape_errors D1 table.",
		color: "#ef4444",
	},

	// Workers AI — right wall
	{
		id: "ai-terminal",
		type: "ai",
		name: "Workers AI",
		project: "oncstrata",
		position: { x: 1210, y: 300 },
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
