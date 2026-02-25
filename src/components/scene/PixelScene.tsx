import { useCallback, useEffect, useRef, useState } from "react";
import { SceneManager } from "./SceneManager";
import { WorkerSprite } from "../sprites/WorkerSprite";
import { FurnitureSprite } from "../sprites/FurnitureSprite";
import { ConnectionLines } from "./ConnectionLines";
import { DetailPanel } from "../panel/DetailPanel";
import { HudBar } from "../hud/HudBar";
import { WORKERS } from "@/lib/worker-registry";
import { INFRA } from "@/lib/infra-registry";
import { DEFAULT_THEME } from "@/lib/theme-registry";
import { useWorkerStatus } from "@/lib/status-fetcher";
import type { SelectedEntity, WorkerStatus } from "@/lib/types";

const WORKER_HIT_SIZE = 64; // Must match WorkerSprite DISPLAY_SIZE
const INFRA_HIT_SIZE = 48; // Must match FurnitureSprite DISPLAY_SIZE

export default function PixelScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneManager | null>(null);
	const workersRef = useRef<Map<string, WorkerSprite>>(new Map());
	const infraRef = useRef<Map<string, FurnitureSprite>>(new Map());
	const connectionsRef = useRef<ConnectionLines | null>(null);
	const [selected, setSelected] = useState<SelectedEntity | null>(null);
	const [loading, setLoading] = useState(true);
	const statusData = useWorkerStatus();

	const handleSelect = useCallback((entity: SelectedEntity) => {
		setSelected((prev) =>
			prev?.type === entity.type && prev?.id === entity.id ? null : entity,
		);
	}, []);

	// Initialize PixiJS scene
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const scene = new SceneManager();
		sceneRef.current = scene;

		scene.init(canvas).then(async () => {
			await scene.drawFloor(DEFAULT_THEME);
			await scene.loadDecorations();

			// Create worker sprites (no PixiJS click — we use native canvas events)
			for (const config of WORKERS) {
				const sprite = new WorkerSprite(config);
				scene.spriteLayer.addChild(sprite.container);
				workersRef.current.set(config.id, sprite);
			}

			// Create infrastructure sprites
			for (const config of INFRA) {
				const sprite = new FurnitureSprite(config);
				scene.furnitureLayer.addChild(sprite.container);
				infraRef.current.set(config.id, sprite);
			}

			// Connection lines
			const workerPositions = WORKERS.map((w) => ({
				config: w,
				x: w.position.x,
				y: w.position.y,
			}));
			const infraPositions = INFRA.map((i) => ({
				config: i,
				x: i.position.x,
				y: i.position.y,
			}));
			const connections = new ConnectionLines(workerPositions, infraPositions);
			scene.connectionLayer.addChild(connections.container);
			connectionsRef.current = connections;

			setLoading(false);
		});

		// Native canvas click handler — bypasses PixiJS v8 scaled container event bug
		const handleCanvasClick = (e: PointerEvent) => {
			const sc = sceneRef.current;
			if (!sc) return;

			const world = sc.screenToWorld(e.offsetX, e.offsetY);

			// Hit-test workers first (they're on top layer)
			for (const [id, sprite] of workersRef.current) {
				const cx = sprite.container.x;
				const cy = sprite.container.y;
				if (
					world.x >= cx &&
					world.x <= cx + WORKER_HIT_SIZE &&
					world.y >= cy &&
					world.y <= cy + WORKER_HIT_SIZE
				) {
					sprite.showSpeechBubble();
					handleSelect({ type: "worker", id });
					return;
				}
			}

			// Hit-test infrastructure
			for (const [id, sprite] of infraRef.current) {
				const cx = sprite.container.x;
				const cy = sprite.container.y;
				if (
					world.x >= cx &&
					world.x <= cx + INFRA_HIT_SIZE &&
					world.y >= cy &&
					world.y <= cy + INFRA_HIT_SIZE
				) {
					handleSelect({ type: "infra", id });
					return;
				}
			}
		};
		canvas.addEventListener("pointerdown", handleCanvasClick);

		// Handle resize
		const handleResize = () => {
			sceneRef.current?.fitToScreen();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			canvas.removeEventListener("pointerdown", handleCanvasClick);
			window.removeEventListener("resize", handleResize);
			for (const sprite of workersRef.current.values()) sprite.destroy();
			for (const sprite of infraRef.current.values()) sprite.destroy();
			connectionsRef.current?.destroy();
			scene.destroy();
			workersRef.current.clear();
			infraRef.current.clear();
		};
	}, [handleSelect]);

	// Update sprites from status data
	useEffect(() => {
		if (!statusData) return;

		for (const [id, data] of Object.entries(statusData.workers)) {
			const sprite = workersRef.current.get(id);
			const status = data.selfReport?.status as WorkerStatus | undefined;

			if (sprite && status) {
				sprite.setStatus(status);

				// When working: tell worker to walk between its connected infra
				if (status === "working") {
					const worker = WORKERS.find((w) => w.id === id);
					if (worker) {
						const positions = worker.connectedInfra
							.map((infraId) => INFRA.find((i) => i.id === infraId))
							.filter(Boolean)
							.map((i) => i!.position);
						sprite.startWorking(positions);

						for (const infraId of worker.connectedInfra) {
							infraRef.current.get(infraId)?.setActive(true);
						}
					}
				} else {
					// Deactivate infra when not working
					const worker = WORKERS.find((w) => w.id === id);
					if (worker) {
						for (const infraId of worker.connectedInfra) {
							infraRef.current.get(infraId)?.setActive(false);
						}
					}
				}
			}

			if (data.selfReport) {
				connectionsRef.current?.setWorkerActive(
					id,
					data.selfReport.status as WorkerStatus,
				);
			}
		}
	}, [statusData]);

	return (
		<div className="dashboard">
			<div className="canvas-area">
				{loading && (
					<div className="loading-overlay">
						<span className="loading-text">Initializing SpriteDash...</span>
					</div>
				)}
				<canvas ref={canvasRef} />
			</div>

			<HudBar />

			{selected && (
				<DetailPanel
					entity={selected}
					statusData={statusData?.workers ?? {}}
					onClose={() => setSelected(null)}
				/>
			)}
		</div>
	);
}
