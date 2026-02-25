import { useCallback, useEffect, useRef, useState } from "react";
import { SceneManager } from "./SceneManager";
import { WorkerSprite } from "../sprites/WorkerSprite";
import { FurnitureSprite } from "../sprites/FurnitureSprite";
import { ConnectionLines } from "./ConnectionLines";
import { InteractionManager } from "./InteractionManager";
import { DetailPanel } from "../panel/DetailPanel";
import { HudBar } from "../hud/HudBar";
import { WORKERS } from "@/lib/worker-registry";
import { INFRA } from "@/lib/infra-registry";
import { DEFAULT_THEME } from "@/lib/theme-registry";
import { useWorkerStatus } from "@/lib/status-fetcher";
import type { SelectedEntity, WorkerStatus } from "@/lib/types";

const WORKER_HIT_SIZE = 64;
const INFRA_HIT_SIZE = 48;
const HIT_PADDING = 24;

export default function PixelScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneManager | null>(null);
	const workersRef = useRef<Map<string, WorkerSprite>>(new Map());
	const infraRef = useRef<Map<string, FurnitureSprite>>(new Map());
	const connectionsRef = useRef<ConnectionLines | null>(null);
	const interactionRef = useRef<InteractionManager | null>(null);
	const [selected, setSelected] = useState<SelectedEntity | null>(null);
	const [loading, setLoading] = useState(true);
	const statusData = useWorkerStatus();
	const lastClickRef = useRef(0);

	// Shared hit-test logic — takes world coordinates, returns matched entity
	const hitTestWorld = useCallback(
		(worldX: number, worldY: number): SelectedEntity | null => {
			for (const [id, sprite] of workersRef.current) {
				const cx = sprite.container.x;
				const cy = sprite.container.y;
				if (
					worldX >= cx - HIT_PADDING &&
					worldX <= cx + WORKER_HIT_SIZE + HIT_PADDING &&
					worldY >= cy - HIT_PADDING &&
					worldY <= cy + WORKER_HIT_SIZE + HIT_PADDING
				) {
					sprite.showSpeechBubble();
					return { type: "worker", id };
				}
			}
			for (const [id, sprite] of infraRef.current) {
				const cx = sprite.container.x;
				const cy = sprite.container.y;
				if (
					worldX >= cx - HIT_PADDING &&
					worldX <= cx + INFRA_HIT_SIZE + HIT_PADDING &&
					worldY >= cy - HIT_PADDING &&
					worldY <= cy + INFRA_HIT_SIZE + HIT_PADDING
				) {
					sprite.pulse();
					return { type: "infra", id };
				}
			}
			return null;
		},
		[],
	);

	const toggleSelect = useCallback((entity: SelectedEntity) => {
		const now = Date.now();
		if (now - lastClickRef.current < 100) return;
		lastClickRef.current = now;
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
			// 1. Room architecture
			await scene.drawFloor(DEFAULT_THEME);
			// 2. Graphics-drawn desks, monitors, chairs
			scene.drawWorkstations();
			// 3. Decorations (pixel-art Graphics — bookshelves, plants, etc.)
			scene.drawRoomDecor();

			// Create worker sprites
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
			const connections = new ConnectionLines(
				workerPositions,
				infraPositions,
			);
			scene.connectionLayer.addChild(connections.container);
			connectionsRef.current = connections;

			// Interaction manager (conversations + triggers)
			const interactions = new InteractionManager(workersRef.current);
			interactionRef.current = interactions;

			// PixiJS stage-level pointerdown for click handling
			scene.onStageClick((worldX, worldY) => {
				const entity = hitTestWorld(worldX, worldY);
				if (entity) toggleSelect(entity);
			});

			setLoading(false);
		});

		// Window mousedown capture phase (backup click handler)
		const handleWindowMouseDown = (e: MouseEvent) => {
			const sc = sceneRef.current;
			if (!sc || !canvas) return;

			const rect = canvas.getBoundingClientRect();
			const screenX = e.clientX - rect.left;
			const screenY = e.clientY - rect.top;

			if (
				screenX < 0 ||
				screenX > rect.width ||
				screenY < 0 ||
				screenY > rect.height
			)
				return;

			const target = e.target as HTMLElement;
			if (target.closest(".hud-bar") || target.closest(".detail-panel-overlay"))
				return;

			const world = sc.screenToWorld(screenX, screenY);
			const entity = hitTestWorld(world.x, world.y);
			if (entity) toggleSelect(entity);
		};
		window.addEventListener("mousedown", handleWindowMouseDown, true);

		const handleResize = () => {
			sceneRef.current?.fitToScreen();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("mousedown", handleWindowMouseDown, true);
			window.removeEventListener("resize", handleResize);
			interactionRef.current?.destroy();
			for (const sprite of workersRef.current.values()) sprite.destroy();
			for (const sprite of infraRef.current.values()) sprite.destroy();
			connectionsRef.current?.destroy();
			scene.destroy();
			workersRef.current.clear();
			infraRef.current.clear();
		};
	}, [hitTestWorld, toggleSelect]);

	// Wire selection state to connection line visibility
	useEffect(() => {
		if (selected) {
			connectionsRef.current?.setSelected(selected.type, selected.id);
		} else {
			connectionsRef.current?.setSelected(null, null);
		}
	}, [selected]);

	// Update sprites from status data (skip workers with no statusKey, e.g. Sonne)
	useEffect(() => {
		if (!statusData) return;

		for (const [id, data] of Object.entries(statusData.workers)) {
			const worker = WORKERS.find((w) => w.id === id);
			if (!worker?.statusKey) continue;

			const sprite = workersRef.current.get(id);
			const status = data.selfReport?.status as WorkerStatus | undefined;

			if (sprite && status) {
				sprite.setStatus(status);

				if (status === "working") {
					// Workers stay near desks — use proxy positions instead of server room infra
					const proxyPositions = worker.connectedInfra.map(
						(_infraId, i) => ({
							x:
								worker.position.x +
								(i % 2 === 0 ? -60 : 60) +
								i * 20,
							y: Math.min(
								worker.position.y + 40 + i * 15,
								410,
							),
						}),
					);
					sprite.startWorking(proxyPositions);

					for (const infraId of worker.connectedInfra) {
						infraRef.current.get(infraId)?.setActive(true);
					}
				} else {
					for (const infraId of worker.connectedInfra) {
						infraRef.current.get(infraId)?.setActive(false);
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
						<span className="loading-text">
							Initializing SpriteDash...
						</span>
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
					onTriggerWorker={(targetId) => {
						interactionRef.current?.triggerWorker(targetId);
					}}
					canTrigger={!interactionRef.current?.isBusy}
				/>
			)}
		</div>
	);
}
