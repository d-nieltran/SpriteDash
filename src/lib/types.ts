export type WorkerStatus = "idle" | "working" | "error" | "celebrate";

export type InfraType = "d1" | "kv" | "r2" | "queue" | "ai";

export interface Position {
	x: number;
	y: number;
}

export interface WorkerConfig {
	id: string;
	name: string;
	character: string;
	project: string;
	cron: string;
	cronLabel: string;
	position: Position;
	personality: string;
	activities: string[];
	connectedInfra: string[];
	externalApis: string[];
	statusKey: string;
	analyticsScriptName: string;
	color: string;
}

export interface InfraConfig {
	id: string;
	type: InfraType;
	name: string;
	project: string;
	position: Position;
	size: string;
	detail: string;
	color: string;
}

export interface WorkerStatusData {
	status: WorkerStatus;
	lastRun: string;
	duration_ms: number;
	activity: string[];
	errorCount: number;
}

export interface WorkerAnalytics {
	invocations24h: number;
	errors24h: number;
	avgCpuMs: number;
}

export interface StatusResponse {
	workers: Record<
		string,
		{
			selfReport: WorkerStatusData | null;
			analytics: WorkerAnalytics | null;
		}
	>;
	timestamp: string;
}

export interface SelectedEntity {
	type: "worker" | "infra";
	id: string;
}

export interface Theme {
	id: string;
	name: string;
	floorColors: {
		spoolprices: string;
		oncstrata: string;
		nieltran: string;
	};
	floorTiles: {
		spoolprices: string;
		oncstrata: string;
		nieltran: string;
	};
	wallBase: string;
	spriteSheetPrefix: string;
}

export interface DecorationConfig {
	id: string;
	sprite: string;
	position: Position;
	zone: string;
	width: number;
	height: number;
}
