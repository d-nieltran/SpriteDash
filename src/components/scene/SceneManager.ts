import {
	Application,
	Container,
	Graphics,
	Text,
	TextStyle,
} from "pixi.js";
import {
	SCENE_WIDTH,
	SCENE_HEIGHT,
	ROOM,
	WALL_HEIGHT,
	OFFICE_Y,
	OFFICE_HEIGHT,
	DIVIDER_Y,
	DIVIDER_HEIGHT,
	SERVER_Y,
	SERVER_HEIGHT,
	WORKSTATIONS,
	DECORATIONS,
} from "@/lib/scene-layout";
import { INFRA } from "@/lib/infra-registry";
import type { Theme } from "@/lib/types";
import { loadTexture } from "@/lib/sprite-loader";

export class SceneManager {
	app: Application;
	world: Container; // Scaled container holding everything
	floorLayer: Container;
	decorLayer: Container;
	furnitureLayer: Container;
	spriteLayer: Container;
	particleLayer: Container;
	connectionLayer: Container;
	private initialized = false;

	constructor() {
		this.app = new Application();
		this.world = new Container();
		this.floorLayer = new Container();
		this.decorLayer = new Container();
		this.furnitureLayer = new Container();
		this.spriteLayer = new Container();
		this.particleLayer = new Container();
		this.connectionLayer = new Container();
	}

	async init(canvas: HTMLCanvasElement): Promise<void> {
		if (this.initialized) return;

		const w = window.innerWidth;
		const h = window.innerHeight;

		await this.app.init({
			canvas,
			width: w,
			height: h,
			background: 0x0b0d13,
			antialias: false,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
		});

		// World container with scaled logical coordinates
		this.app.stage.eventMode = "static";
		this.world.eventMode = "passive";
		this.world.interactiveChildren = true;
		this.app.stage.addChild(this.world);

		// Add layers in z-order inside world
		this.world.addChild(this.floorLayer);
		this.world.addChild(this.decorLayer);
		this.world.addChild(this.connectionLayer);
		this.world.addChild(this.furnitureLayer);
		this.world.addChild(this.spriteLayer);
		this.world.addChild(this.particleLayer);

		// Enable Y-depth sorting (from pixel-agents pattern)
		this.spriteLayer.sortableChildren = true;
		this.furnitureLayer.sortableChildren = true;

		this.fitToScreen();
		this.initialized = true;
	}

	fitToScreen(): void {
		const w = window.innerWidth;
		const h = window.innerHeight;

		this.app.renderer.resize(w, h);

		// Scale world to fill viewport while maintaining aspect ratio
		const scaleX = w / SCENE_WIDTH;
		const scaleY = h / SCENE_HEIGHT;
		const scale = Math.max(scaleX, scaleY); // Cover (not contain)

		this.world.scale.set(scale);

		// Center the world
		this.world.x = (w - SCENE_WIDTH * scale) / 2;
		this.world.y = (h - SCENE_HEIGHT * scale) / 2;
	}

	async drawFloor(_theme: Theme): Promise<void> {
		this.floorLayer.removeChildren();

		const g = new Graphics();

		// === BACK WALL ===
		g.rect(0, 0, SCENE_WIDTH, WALL_HEIGHT);
		g.fill(0x1e2230);

		// === OFFICE FLOOR ===
		g.rect(0, OFFICE_Y, SCENE_WIDTH, OFFICE_HEIGHT);
		g.fill(0x1a1e28);

		// === DIVIDER STRIP ===
		g.rect(0, DIVIDER_Y, SCENE_WIDTH, DIVIDER_HEIGHT);
		g.fill(0x15181f);

		// === SERVER ROOM FLOOR ===
		g.rect(0, SERVER_Y, SCENE_WIDTH, SERVER_HEIGHT);
		g.fill(0x12141a);

		this.floorLayer.addChild(g);

		// === WALL TRIM LINE ===
		const wallTrim = new Graphics();
		wallTrim.moveTo(0, OFFICE_Y);
		wallTrim.lineTo(SCENE_WIDTH, OFFICE_Y);
		wallTrim.stroke({ width: 2, color: 0x2a3040, alpha: 0.6 });
		this.floorLayer.addChild(wallTrim);

		// === DIVIDER LINES ===
		const dividerLines = new Graphics();
		dividerLines.moveTo(0, DIVIDER_Y);
		dividerLines.lineTo(SCENE_WIDTH, DIVIDER_Y);
		dividerLines.stroke({ width: 1, color: 0x2a3040, alpha: 0.5 });
		dividerLines.moveTo(0, SERVER_Y);
		dividerLines.lineTo(SCENE_WIDTH, SERVER_Y);
		dividerLines.stroke({ width: 1, color: 0x2a3040, alpha: 0.3 });
		this.floorLayer.addChild(dividerLines);

		// === SIDE WALLS ===
		const sideWalls = new Graphics();
		sideWalls.rect(0, 0, 8, SCENE_HEIGHT);
		sideWalls.rect(SCENE_WIDTH - 8, 0, 8, SCENE_HEIGHT);
		sideWalls.fill(0x1e2230);
		this.floorLayer.addChild(sideWalls);

		// === OFFICE FLOOR GRID ===
		const officeGrid = new Graphics();
		for (let y = OFFICE_Y + 40; y < DIVIDER_Y; y += 40) {
			officeGrid.moveTo(0, y);
			officeGrid.lineTo(SCENE_WIDTH, y);
		}
		officeGrid.stroke({ width: 1, color: 0x1e2230, alpha: 0.25 });

		const officeGridV = new Graphics();
		for (let x = 80; x < SCENE_WIDTH; x += 80) {
			officeGridV.moveTo(x, OFFICE_Y);
			officeGridV.lineTo(x, DIVIDER_Y);
		}
		officeGridV.stroke({ width: 1, color: 0x1e2230, alpha: 0.15 });
		this.floorLayer.addChild(officeGrid);
		this.floorLayer.addChild(officeGridV);

		// === SERVER ROOM GRID ===
		const serverGrid = new Graphics();
		for (let y = SERVER_Y + 40; y < SCENE_HEIGHT; y += 40) {
			serverGrid.moveTo(0, y);
			serverGrid.lineTo(SCENE_WIDTH, y);
		}
		serverGrid.stroke({ width: 1, color: 0x1a1c22, alpha: 0.2 });

		const serverGridV = new Graphics();
		for (let x = 80; x < SCENE_WIDTH; x += 80) {
			serverGridV.moveTo(x, SERVER_Y);
			serverGridV.lineTo(x, SCENE_HEIGHT);
		}
		serverGridV.stroke({ width: 1, color: 0x1a1c22, alpha: 0.12 });
		this.floorLayer.addChild(serverGrid);
		this.floorLayer.addChild(serverGridV);

		// === ROOM LABEL: "SPRITEDASH HQ" ===
		const labelBg = new Graphics();
		const labelText = new Text({
			text: ROOM.label,
			style: new TextStyle({
				fontFamily: "Inter, SF Pro Display, sans-serif",
				fontSize: 11,
				fill: 0xffffff,
				fontWeight: "600",
				letterSpacing: 0.8,
			}),
		});
		const padding = 8;
		const labelW = labelText.width + padding * 2;
		const labelH = 22;
		labelBg.roundRect(16, 16, labelW, labelH, 4);
		labelBg.fill({ color: 0x000000, alpha: 0.3 });
		labelText.x = 16 + padding;
		labelText.y = 16 + 4;
		labelText.alpha = 0.7;
		this.floorLayer.addChild(labelBg);
		this.floorLayer.addChild(labelText);

		// === SERVER ROOM LABEL ===
		const srLabelBg = new Graphics();
		const srLabelText = new Text({
			text: "SERVER ROOM",
			style: new TextStyle({
				fontFamily: "Inter, SF Pro Display, sans-serif",
				fontSize: 10,
				fill: 0xffffff,
				fontWeight: "600",
				letterSpacing: 1.5,
			}),
		});
		const srLabelW = srLabelText.width + padding * 2;
		const srLabelH = 20;
		srLabelBg.roundRect(16, DIVIDER_Y + 5, srLabelW, srLabelH, 4);
		srLabelBg.fill({ color: 0x000000, alpha: 0.25 });
		srLabelText.x = 16 + padding;
		srLabelText.y = DIVIDER_Y + 5 + 3;
		srLabelText.alpha = 0.5;
		this.floorLayer.addChild(srLabelBg);
		this.floorLayer.addChild(srLabelText);
	}

	/** Draw Graphics-based workstation clusters (desks, monitors, chairs) */
	drawWorkstations(): void {
		for (const ws of WORKSTATIONS) {
			const desk = new Graphics();

			// Desk surface
			desk.roundRect(ws.desk.x, ws.desk.y, ws.desk.w, ws.desk.h, 3);
			desk.fill(0x2c3040);

			// Front edge (3D depth cue)
			desk.rect(ws.desk.x, ws.desk.y + ws.desk.h, ws.desk.w, 4);
			desk.fill(0x3a4050);

			// Monitor body
			desk.roundRect(ws.monitor.x, ws.monitor.y, 24, 16, 2);
			desk.fill(0x1a1c24);

			// Monitor screen with project color glow
			desk.roundRect(ws.monitor.x + 2, ws.monitor.y + 2, 20, 12, 1);
			desk.fill({ color: ws.screenColor, alpha: 0.15 });

			// Chair circle
			desk.circle(ws.chair.cx, ws.chair.cy, 10);
			desk.fill(0x252830);

			this.floorLayer.addChild(desk);
		}
	}

	/** Draw opaque backing panels behind each infra position to hide transparency artifacts */
	drawInfraBackgrounds(): void {
		for (const infra of INFRA) {
			const panel = new Graphics();
			panel.roundRect(infra.position.x - 4, infra.position.y - 4, 56, 56, 6);
			panel.fill(0x1a1c22);
			panel.roundRect(infra.position.x - 4, infra.position.y - 4, 56, 56, 6);
			panel.stroke({ width: 1, color: 0x2a3040, alpha: 0.3 });
			this.decorLayer.addChild(panel);
		}
	}

	async loadDecorations(): Promise<void> {
		this.decorLayer.removeChildren();

		// Re-draw infra backgrounds (they're in decorLayer)
		this.drawInfraBackgrounds();

		for (const decor of DECORATIONS) {
			const texture = await loadTexture(decor.sprite);
			if (!texture) continue;

			const sprite = new (await import("pixi.js")).Sprite(texture);
			sprite.x = decor.x;
			sprite.y = decor.y;
			sprite.width = decor.width;
			sprite.height = decor.height;
			sprite.alpha = 0.8;
			this.decorLayer.addChild(sprite);
		}
	}

	/** Convert screen coordinates to world (logical scene) coordinates */
	screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
		const scale = this.world.scale.x;
		return {
			x: (screenX - this.world.x) / scale,
			y: (screenY - this.world.y) / scale,
		};
	}

	/** Register a click handler on the PixiJS stage (root level). */
	onStageClick(callback: (worldX: number, worldY: number) => void): void {
		this.app.stage.on("pointerdown", (e) => {
			const worldPos = e.getLocalPosition(this.world);
			callback(worldPos.x, worldPos.y);
		});
	}

	destroy(): void {
		this.app.destroy(true);
		this.initialized = false;
	}
}
