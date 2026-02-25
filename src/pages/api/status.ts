import type { APIRoute } from "astro";
import { WORKERS } from "@/lib/worker-registry";

const ANALYTICS_CACHE_KEY = "spritedash:analytics";
const ANALYTICS_TTL = 300; // 5 minutes

interface Env {
	STATUS_KV: KVNamespace;
	CF_API_TOKEN: string;
	CF_ACCOUNT_ID: string;
}

export const GET: APIRoute = async ({ locals }) => {
	const env = (locals as { runtime: { env: Env } }).runtime.env;

	// Layer 1: Read self-reported status from each worker
	const statuses = await Promise.all(
		WORKERS.map(async (w) => {
			try {
				const data = await env.STATUS_KV?.get(w.statusKey, "json");
				return [w.id, data] as const;
			} catch {
				return [w.id, null] as const;
			}
		}),
	);

	// Layer 2: CF GraphQL Analytics (cached)
	let analytics: Record<string, unknown> | null = null;
	try {
		analytics = await getCachedAnalytics(env);
	} catch {
		// Analytics are optional — proceed without them
	}

	const workers: Record<string, unknown> = {};
	for (const [id, selfReport] of statuses) {
		workers[id] = {
			selfReport: selfReport ?? null,
			analytics: analytics?.[id] ?? null,
		};
	}

	return new Response(
		JSON.stringify({ workers, timestamp: new Date().toISOString() }),
		{ headers: { "Content-Type": "application/json" } },
	);
};

async function getCachedAnalytics(
	env: Env,
): Promise<Record<string, unknown> | null> {
	if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID || !env.STATUS_KV) return null;

	// Check cache
	const cached = await env.STATUS_KV.get(ANALYTICS_CACHE_KEY, "json");
	if (cached) return cached as Record<string, unknown>;

	// Query Cloudflare GraphQL
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const scriptNames = WORKERS.map((w) => w.analyticsScriptName);

	const query = `
		query {
			viewer {
				accounts(filter: { accountTag: "${env.CF_ACCOUNT_ID}" }) {
					workersInvocationsAdaptive(
						filter: {
							datetime_gt: "${since}"
							scriptName_in: [${scriptNames.map((n) => `"${n}"`).join(",")}]
						}
						limit: 100
						orderBy: [datetime_ASC]
					) {
						dimensions {
							scriptName
						}
						sum {
							requests
							errors
						}
						quantiles {
							cpuTimeP50
						}
					}
				}
			}
		}
	`;

	const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.CF_API_TOKEN}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query }),
	});

	if (!res.ok) return null;

	const json = (await res.json()) as {
		data?: {
			viewer?: {
				accounts?: Array<{
					workersInvocationsAdaptive?: Array<{
						dimensions: { scriptName: string };
						sum: { requests: number; errors: number };
						quantiles: { cpuTimeP50: number };
					}>;
				}>;
			};
		};
	};
	const rows =
		json.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];

	const result: Record<string, unknown> = {};
	for (const row of rows) {
		result[row.dimensions.scriptName] = {
			invocations24h: row.sum.requests,
			errors24h: row.sum.errors,
			avgCpuMs: row.quantiles.cpuTimeP50,
		};
	}

	// Cache for 5 minutes
	await env.STATUS_KV.put(ANALYTICS_CACHE_KEY, JSON.stringify(result), {
		expirationTtl: ANALYTICS_TTL,
	});

	return result;
}
