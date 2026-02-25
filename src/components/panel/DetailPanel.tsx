import type {
	WorkerConfig,
	InfraConfig,
	WorkerStatusData,
	WorkerAnalytics,
	SelectedEntity,
} from "@/lib/types";
import { getWorker } from "@/lib/worker-registry";
import { getInfra } from "@/lib/infra-registry";
import { getNextRun, formatTimeUntil } from "@/lib/cron-parser";
import { WORKERS } from "@/lib/worker-registry";
import { INFRA } from "@/lib/infra-registry";

interface DetailPanelProps {
	entity: SelectedEntity;
	statusData: Record<
		string,
		{ selfReport: WorkerStatusData | null; analytics: WorkerAnalytics | null }
	>;
	onClose: () => void;
}

export function DetailPanel({ entity, statusData, onClose }: DetailPanelProps) {
	if (entity.type === "worker") {
		return (
			<WorkerPanel
				config={getWorker(entity.id)!}
				status={statusData[entity.id] ?? null}
				onClose={onClose}
			/>
		);
	}
	return <InfraPanel config={getInfra(entity.id)!} onClose={onClose} />;
}

function WorkerPanel({
	config,
	status,
	onClose,
}: {
	config: WorkerConfig;
	status: {
		selfReport: WorkerStatusData | null;
		analytics: WorkerAnalytics | null;
	} | null;
	onClose: () => void;
}) {
	const selfReport = status?.selfReport;
	const analytics = status?.analytics;
	const nextRun = getNextRun(config.cron);
	const statusColor = selfReport?.status === "working"
		? "text-green-400"
		: selfReport?.status === "error"
			? "text-red-400"
			: "text-slate-400";

	return (
		<div className="detail-panel absolute right-0 top-0 h-full w-80 bg-[#0f1117] border-l border-[#38394b] overflow-y-auto text-white p-4 font-mono text-sm">
			<button
				type="button"
				onClick={onClose}
				className="absolute top-3 right-3 text-slate-500 hover:text-white text-lg"
			>
				x
			</button>

			<div className="flex items-center gap-3 mb-4">
				<div
					className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
					style={{ backgroundColor: config.color }}
				>
					{config.character[4]}
				</div>
				<div>
					<h2 className="text-base font-bold">{config.name}</h2>
					<p className="text-xs text-slate-400">{config.character}</p>
				</div>
			</div>

			<p className="text-xs text-slate-500 mb-4 italic">{config.personality}</p>

			<Section title="Status">
				<p className={statusColor}>
					{selfReport?.status ?? "unknown"}
				</p>
				{selfReport && (
					<>
						<Row label="Last run" value={formatTime(selfReport.lastRun)} />
						<Row label="Duration" value={`${selfReport.duration_ms}ms`} />
						<Row label="Errors" value={String(selfReport.errorCount)} />
					</>
				)}
				<Row label="Next run" value={formatTimeUntil(nextRun)} />
				<Row label="Schedule" value={config.cronLabel} />
			</Section>

			{analytics && (
				<Section title="24h Analytics">
					<Row label="Invocations" value={String(analytics.invocations24h)} />
					<Row label="Errors" value={String(analytics.errors24h)} />
					<Row label="Avg CPU" value={`${analytics.avgCpuMs}ms`} />
				</Section>
			)}

			{selfReport?.activity && selfReport.activity.length > 0 && (
				<Section title="Recent Activity">
					{selfReport.activity.map((a) => (
						<p key={a} className="text-xs text-slate-300 mb-1">
							{a}
						</p>
					))}
				</Section>
			)}

			<Section title="Activities">
				{config.activities.map((a) => (
					<p key={a} className="text-xs text-slate-400 mb-1">
						{a}
					</p>
				))}
			</Section>

			<Section title="Connected Infrastructure">
				{config.connectedInfra.map((id) => {
					const infra = getInfra(id);
					return (
						<p key={id} className="text-xs text-slate-300 mb-1">
							[{infra?.type.toUpperCase()}] {infra?.name}
						</p>
					);
				})}
			</Section>

			<Section title="External APIs">
				{config.externalApis.map((api) => (
					<p key={api} className="text-xs text-slate-300 mb-1">
						{api}
					</p>
				))}
			</Section>
		</div>
	);
}

function InfraPanel({
	config,
	onClose,
}: { config: InfraConfig; onClose: () => void }) {
	const connectedWorkers = WORKERS.filter((w) =>
		w.connectedInfra.includes(config.id),
	);

	return (
		<div className="detail-panel absolute right-0 top-0 h-full w-80 bg-[#0f1117] border-l border-[#38394b] overflow-y-auto text-white p-4 font-mono text-sm">
			<button
				type="button"
				onClick={onClose}
				className="absolute top-3 right-3 text-slate-500 hover:text-white text-lg"
			>
				x
			</button>

			<div className="flex items-center gap-3 mb-4">
				<div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-slate-700">
					{config.type.toUpperCase()}
				</div>
				<div>
					<h2 className="text-base font-bold">{config.name}</h2>
					<p className="text-xs text-slate-400">{config.project}</p>
				</div>
			</div>

			<Section title="Details">
				<Row label="Type" value={config.type.toUpperCase()} />
				<Row label="Size" value={config.size} />
				<p className="text-xs text-slate-400 mt-2">{config.detail}</p>
			</Section>

			<Section title="Used By">
				{connectedWorkers.map((w) => (
					<p key={w.id} className="text-xs text-slate-300 mb-1">
						{w.character} ({w.name})
					</p>
				))}
			</Section>
		</div>
	);
}

function Section({
	title,
	children,
}: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-4">
			<h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-[#38394b] pb-1">
				{title}
			</h3>
			{children}
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between text-xs mb-1">
			<span className="text-slate-500">{label}</span>
			<span className="text-slate-200">{value}</span>
		</div>
	);
}

function formatTime(iso: string): string {
	try {
		const d = new Date(iso);
		return d.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "UTC",
		});
	} catch {
		return iso;
	}
}
