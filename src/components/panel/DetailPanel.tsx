import type {
	WorkerConfig,
	InfraConfig,
	WorkerStatusData,
	WorkerAnalytics,
	SelectedEntity,
} from "@/lib/types";
import { getWorker, WORKERS } from "@/lib/worker-registry";
import { getInfra } from "@/lib/infra-registry";
import { getNextRun, formatTimeUntil } from "@/lib/cron-parser";

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
	const statusKey = selfReport?.status ?? "unknown";

	return (
		<div className="detail-panel-overlay glass-strong">
			<button type="button" onClick={onClose} className="detail-close">
				&times;
			</button>

			<div className="detail-header">
				<div className="detail-avatar" style={{ backgroundColor: config.color }}>
					{config.character.charAt(4)}
				</div>
				<div>
					<div className="detail-name">{config.name}</div>
					<div className="detail-subtitle">{config.character} &middot; {config.project}</div>
				</div>
			</div>

			<div style={{ marginBottom: 12 }}>
				<span className={`detail-tag status-${statusKey}`}>
					<span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
					{statusKey}
				</span>
			</div>

			<div className="detail-personality">{config.personality}</div>

			<Section title="Status">
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
						<div key={a} className="detail-list-item">{a}</div>
					))}
				</Section>
			)}

			<Section title="Activities">
				{config.activities.map((a) => (
					<div key={a} className="detail-list-item">{a}</div>
				))}
			</Section>

			<Section title="Connected Infrastructure">
				{config.connectedInfra.map((id) => {
					const infra = getInfra(id);
					return (
						<div key={id} className="detail-list-item">
							<span style={{ color: "rgba(255,255,255,0.25)", marginRight: 4 }}>
								[{infra?.type.toUpperCase()}]
							</span>
							{infra?.name}
						</div>
					);
				})}
			</Section>

			<Section title="External APIs">
				{config.externalApis.map((api) => (
					<div key={api} className="detail-list-item">{api}</div>
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
		<div className="detail-panel-overlay glass-strong">
			<button type="button" onClick={onClose} className="detail-close">
				&times;
			</button>

			<div className="detail-header">
				<div className="detail-avatar" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
					{config.type.toUpperCase()}
				</div>
				<div>
					<div className="detail-name">{config.name}</div>
					<div className="detail-subtitle">{config.project}</div>
				</div>
			</div>

			<Section title="Details">
				<Row label="Type" value={config.type.toUpperCase()} />
				<Row label="Size" value={config.size} />
				<div className="detail-list-item" style={{ marginTop: 6 }}>{config.detail}</div>
			</Section>

			<Section title="Used By">
				{connectedWorkers.map((w) => (
					<div key={w.id} className="detail-list-item">
						<span style={{ color: w.color, marginRight: 4 }}>&bull;</span>
						{w.character} ({w.name})
					</div>
				))}
			</Section>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="detail-section">
			<div className="detail-section-title">{title}</div>
			{children}
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="detail-row">
			<span className="detail-row-label">{label}</span>
			<span className="detail-row-value">{value}</span>
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
