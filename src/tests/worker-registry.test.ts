import { describe, it, expect } from "vitest";
import { WORKERS, getWorker } from "../lib/worker-registry";
import { INFRA, getInfra } from "../lib/infra-registry";

describe("worker-registry", () => {
	it("has 5 workers", () => {
		expect(WORKERS).toHaveLength(5);
	});

	it("all worker IDs are unique", () => {
		const ids = WORKERS.map((w) => w.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("all worker status keys are unique", () => {
		const keys = WORKERS.map((w) => w.statusKey);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("getWorker returns correct worker", () => {
		const worker = getWorker("oncstrata-worker");
		expect(worker?.name).toBe("OncStrata Worker");
	});

	it("getWorker returns undefined for unknown ID", () => {
		expect(getWorker("nonexistent")).toBeUndefined();
	});

	it("all connectedInfra IDs reference existing infrastructure", () => {
		const infraIds = new Set(INFRA.map((i) => i.id));
		for (const worker of WORKERS) {
			for (const infraId of worker.connectedInfra) {
				expect(infraIds.has(infraId)).toBe(true);
			}
		}
	});
});

describe("infra-registry", () => {
	it("has 11 infrastructure objects", () => {
		expect(INFRA).toHaveLength(11);
	});

	it("all infra IDs are unique", () => {
		const ids = INFRA.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("getInfra returns correct infra", () => {
		const infra = getInfra("d1-oncstrata");
		expect(infra?.name).toBe("oncstrata-faers");
	});

	it("has expected type distribution", () => {
		const counts = INFRA.reduce(
			(acc, i) => {
				acc[i.type] = (acc[i.type] ?? 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
		expect(counts.d1).toBe(4);
		expect(counts.kv).toBe(3);
		expect(counts.r2).toBe(1);
		expect(counts.queue).toBe(2);
		expect(counts.ai).toBe(1);
	});
});
