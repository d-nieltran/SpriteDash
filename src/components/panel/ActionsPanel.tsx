import { WORKERS } from "@/lib/worker-registry";

interface ActionsPanelProps {
	onDispatch: (targetId: string) => void;
	onChat: () => void;
}

export function ActionsPanel({ onDispatch, onChat }: ActionsPanelProps) {
	const dispatchable = WORKERS.filter((w) => w.role !== "manager");

	return (
		<div className="actions-panel glass-strong">
			<div className="actions-header">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ width: 14, height: 14, color: "#e879f9" }}
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
				<span>Actions</span>
			</div>

			<div className="actions-section">
				<div className="actions-section-label">Dispatch Worker</div>
				{dispatchable.map((w) => (
					<button
						key={w.id}
						type="button"
						className="action-btn"
						onClick={() => onDispatch(w.id)}
					>
						<span
							className="action-dot"
							style={{ background: w.color }}
						/>
						<span className="action-btn-label">
							Run {w.character}
						</span>
					</button>
				))}
			</div>

			<div className="actions-divider" />

			<div className="actions-section">
				<div className="actions-section-label">Team</div>
				<button
					type="button"
					className="action-btn action-btn-chat"
					onClick={onChat}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						style={{ width: 12, height: 12, flexShrink: 0 }}
					>
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
					<span className="action-btn-label">Make Them Chat</span>
				</button>
			</div>
		</div>
	);
}
