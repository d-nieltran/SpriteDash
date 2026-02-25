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
import { SCENE_WIDTH, SCENE_HEIGHT } from "@/lib/scene-layout";
import { useWorkerStatus } from "@/lib/status-fetcher";
import type { SelectedEntity, WorkerStatus } from "@/lib/types";

export default function PixelScene() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<SceneManager | null>(null);
	const workersRef = useRef<Map<string, WorkerSprite>>(new Map());
	const infraRef = useRef<Map<string, FurnitureSprite>>(new Map());
	const connectionsRef = useRef<ConnectionLines | null>(null);
	const [selected, setSelected] = useState<SelectedEntity | null>(null);
	const [scale, setScale] = useState(1);
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
			// Draw floor (async — loads tile textures)
			await scene.drawFloor(DEFAULT_THEME);

			// Load decorations (async — loads decor sprite textures)
			await scene.loadDecorations();

			// Create worker sprites (each loads its own sprite sheet async)
			for (const config of WORKERS) {
				const sprite = new WorkerSprite(config);
				sprite.onClick(() =>
					handleSelect({ type: "worker", id: config.id }),
				);
				scene.spriteLayer.addChild(sprite.container);
				workersRef.current.set(config.id, sprite);
			}

			// Create infrastructure sprites (each loads its own sprite async)
			for (const config of INFRA) {
				const sprite = new FurnitureSprite(config);
				sprite.onClick(() =>
					handleSelect({ type: "infra", id: config.id }),
				);
				scene.furnitureLayer.addChild(sprite.container);
				infraRef.current.set(config.id, sprite);
			}

			// Create connection lines
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

			setLoading(false);
		});

		return () => {
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
			if (sprite && data.selfReport) {
				sprite.setStatus(data.selfReport.status as WorkerStatus);
			}

			// Update connection line activity
			if (data.selfReport) {
				connectionsRef.current?.setWorkerActive(
					id,
					data.selfReport.status as WorkerStatus,
				);
			}

			// Activate furniture when worker is working
			if (data.selfReport?.status === "working") {
				const worker = WORKERS.find((w) => w.id === id);
				if (worker) {
					for (const infraId of worker.connectedInfra) {
						infraRef.current.get(infraId)?.setActive(true);
					}
				}
			}
		}
	}, [statusData]);

	// Responsive scaling
	useEffect(() => {
		const handleResize = () => {
			const s = Math.min(
				1,
				window.innerWidth / SCENE_WIDTH,
				window.innerHeight / SCENE_HEIGHT,
			);
			setScale(s);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div className="scene-wrapper">
			<div
				className="scene-container"
				style={{ transform: `scale(${scale})` }}
			>
				<HudBar />
				<div style={{ position: "relative" }}>
					{loading && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								zIndex: 10,
								color: "#94a3b8",
								fontFamily: "Courier New",
								fontSize: 14,
							}}
						>
							Loading sprites...
						</div>
					)}
					<canvas ref={canvasRef} />
				</div>
				{selected && (
					<DetailPanel
						entity={selected}
						statusData={statusData?.workers ?? {}}
						onClose={() => setSelected(null)}
					/>
				)}
			</div>
		</div>
	);
}
