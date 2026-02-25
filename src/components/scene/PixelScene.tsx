import { useCallback, useEffect, useRef, useState } from "react";
import { SceneManager } from "./SceneManager";
import { WorkerSprite } from "../sprites/WorkerSprite";
import { FurnitureSprite } from "../sprites/FurnitureSprite";
import { ConnectionLines } from "./ConnectionLines";
import { InteractionManager } from "./InteractionManager";
import { Scoreboard } from "./Scoreboard";
import { DetailPanel } from "../panel/DetailPanel";
import { ActionsPanel } from "../panel/ActionsPanel";
import { ActivityFeed, type ActivityEvent } from "../panel/ActivityFeed";
import { HudBar } from "../hud/HudBar";
import { WORKERS } from "@/lib/worker-registry";
import { INFRA } from "@/lib/infra-registry";
import { DEFAULT_THEME } from "@/lib/theme-registry";
import { useWorkerStatus } from "@/lib/status-fetcher";
import type { SelectedEntity, WorkerStatus } from "@/lib/types";

const WORKER_HIT_SIZE = 64;
const INFRA_HIT_SIZE = 48;
const HIT_PADDING = 24;
const DOUBLE_CLICK_MS = 400;

// Dispatch order: workers that aren't the manager
const DISPATCHABLE = WORKERS.filter((w) => w.role !== "manager");

export default function PixelScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneManager | null>(null);
	const workersRef = useRef<Map<string, WorkerSprite>>(new Map());
	const infraRef = useRef<Map<string, FurnitureSprite>>(new Map());
	const connectionsRef = useRef<ConnectionLines | null>(null);
	const interactionRef = useRef<InteractionManager | null>(null);
	const scoreboardRef = useRef<Scoreboard | null>(null);
	const [selected, setSelected] = useState<SelectedEntity | null>(null);
	const [loading, setLoading] = useState(true);
	const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
	const statusData = useWorkerStatus();
	const lastClickRef = useRef(0);
	const lastClickEntityRef = useRef<string | null>(null);
	const lastClickTimeRef = useRef(0);
	const eventIdRef = useRef(0);
	const hoveredRef = useRef<string | null>(null);

	const addEvent = useCallback((text: string) => {
		const id = ++eventIdRef.current;
		setActivityEvents((prev) => [...prev.slice(-9), { id, text, time: Date.now() }]);
	}, []);

	// Shared hit-test logic — takes world coordinates, returns closest matched entity
	const hitTestWorld = useCallback(
		(worldX: number, worldY: number): SelectedEntity | null => {
			// Find closest worker within hit area
			let bestWorker: { id: string; dist: number } | null = null;
			for (const [id, sprite] of workersRef.current) {
				const cx = sprite.container.x;
				const cy = sprite.container.y;
				if (
					worldX >= cx - HIT_PADDING &&
					worldX <= cx + WORKER_HIT_SIZE + HIT_PADDING &&
					worldY >= cy - HIT_PADDING &&
					worldY <= cy + WORKER_HIT_SIZE + HIT_PADDING
				) {
					const centerX = cx + WORKER_HIT_SIZE / 2;
					const centerY = cy + WORKER_HIT_SIZE / 2;
					const dist = (worldX - centerX) ** 2 + (worldY - centerY) ** 2;
					if (!bestWorker || dist < bestWorker.dist) {
						bestWorker = { id, dist };
					}
				}
			}
			if (bestWorker) {
				workersRef.current.get(bestWorker.id)?.showSpeechBubble();
				return { type: "worker", id: bestWorker.id };
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
		if (now - lastClickRef.current < 250) return;
		lastClickRef.current = now;

		// Double-click detection for workers
		if (entity.type === "worker") {
			const timeSince = now - lastClickTimeRef.current;
			const sameEntity = lastClickEntityRef.current === entity.id;
			lastClickEntityRef.current = entity.id;
			lastClickTimeRef.current = now;

			if (sameEntity && timeSince < DOUBLE_CLICK_MS) {
				// Double-click: dispatch worker (or force chat for Sonne)
				if (entity.id === "sonne-manager") {
					interactionRef.current?.forceChat();
				} else {
					interactionRef.current?.triggerWorker(entity.id);
				}
				lastClickEntityRef.current = null;
				return;
			}
		}

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

			// Scoreboard on the whiteboard (same position as whiteboard: 340, 4)
			const scoreboard = new Scoreboard(340, 4, 90, 50);
			scene.decorLayer.addChild(scoreboard.container);
			scoreboardRef.current = scoreboard;

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

			// Interaction manager (conversations + triggers) with event callback
			const interactions = new InteractionManager(
				workersRef.current,
				(text) => {
					addEvent(text);
					// Increment scoreboard based on event type
					if (text.startsWith("Dispatched")) {
						scoreboard.increment("dispatches");
					} else if (text.includes("chatting")) {
						scoreboard.increment("chats");
					}
				},
			);
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
			if (target.closest(".hud-bar") || target.closest(".detail-panel-overlay") || target.closest(".actions-panel"))
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

		// Keyboard shortcuts: 1-5 dispatch, C for chat
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			const key = e.key.toLowerCase();
			if (key >= "1" && key <= "5") {
				const idx = Number.parseInt(key) - 1;
				if (idx < DISPATCHABLE.length) {
					interactionRef.current?.triggerWorker(DISPATCHABLE[idx].id);
				}
			} else if (key === "c") {
				interactionRef.current?.forceChat();
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("mousedown", handleWindowMouseDown, true);
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("keydown", handleKeyDown);
			interactionRef.current?.destroy();
			scoreboardRef.current?.destroy();
			for (const sprite of workersRef.current.values()) sprite.destroy();
			for (const sprite of infraRef.current.values()) sprite.destroy();
			connectionsRef.current?.destroy();
			scene.destroy();
			workersRef.current.clear();
			infraRef.current.clear();
		};
	}, [hitTestWorld, toggleSelect, addEvent]);

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

			<ActionsPanel
				onDispatch={(targetId) => {
					interactionRef.current?.triggerWorker(targetId);
				}}
				onChat={() => {
					interactionRef.current?.forceChat();
				}}
			/>

			{selected && (
				<DetailPanel
					entity={selected}
					statusData={statusData?.workers ?? {}}
					onClose={() => setSelected(null)}
					onTriggerWorker={(targetId) => {
						interactionRef.current?.triggerWorker(targetId);
					}}
					canTrigger={true}
				/>
			)}

			<ActivityFeed events={activityEvents} />
		</div>
	);
}
