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
} from "@/lib/scene-layout";
import { INFRA } from "@/lib/infra-registry";
import {
	PAL,
	drawBookshelf,
	drawPlant,
	drawClock,
	drawWaterCooler,
	drawWindow,
	drawWhiteboard,
	drawServerRack,
	drawLamp,
} from "@/lib/pixel-art";
import type { Theme } from "@/lib/types";

const TILE = 40; // Floor tile size

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
			background: 0x1a1810, // Warm dark behind scene
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

		// === BACK WALL (warm gray) ===
		g.rect(0, 0, SCENE_WIDTH, WALL_HEIGHT);
		g.fill(PAL.wallMain);

		// === OFFICE FLOOR (warm beige base) ===
		g.rect(0, OFFICE_Y, SCENE_WIDTH, OFFICE_HEIGHT);
		g.fill(PAL.floorA);

		// === DIVIDER STRIP ===
		g.rect(0, DIVIDER_Y, SCENE_WIDTH, DIVIDER_HEIGHT);
		g.fill(PAL.divider);

		// === SERVER ROOM FLOOR (keep dark) ===
		g.rect(0, SERVER_Y, SCENE_WIDTH, SERVER_HEIGHT);
		g.fill(PAL.serverFloor);

		this.floorLayer.addChild(g);

		// === FLOOR TILE CHECKERBOARD (subtle alternating tiles) ===
		const checker = new Graphics();
		const tilesX = Math.ceil(SCENE_WIDTH / TILE);
		const tilesY = Math.ceil(OFFICE_HEIGHT / TILE);
		for (let ty = 0; ty < tilesY; ty++) {
			for (let tx = 0; tx < tilesX; tx++) {
				if ((tx + ty) % 2 === 0) {
					checker.rect(tx * TILE, OFFICE_Y + ty * TILE, TILE, TILE);
				}
			}
		}
		checker.fill(PAL.floorB);
		this.floorLayer.addChild(checker);

		// === BASEBOARD TRIM (wall-to-floor transition) ===
		const baseboard = new Graphics();
		baseboard.rect(0, OFFICE_Y - 3, SCENE_WIDTH, 6);
		baseboard.fill(PAL.wallDark);
		baseboard.moveTo(0, OFFICE_Y + 3);
		baseboard.lineTo(SCENE_WIDTH, OFFICE_Y + 3);
		baseboard.stroke({ width: 1, color: PAL.woodEdge, alpha: 0.6 });
		this.floorLayer.addChild(baseboard);

		// === OFFICE FLOOR GRID ===
		const officeGrid = new Graphics();
		for (let y = OFFICE_Y + TILE; y < DIVIDER_Y; y += TILE) {
			officeGrid.moveTo(0, y);
			officeGrid.lineTo(SCENE_WIDTH, y);
		}
		officeGrid.stroke({ width: 1, color: PAL.floorLine, alpha: 0.35 });

		const officeGridV = new Graphics();
		for (let x = TILE; x < SCENE_WIDTH; x += TILE) {
			officeGridV.moveTo(x, OFFICE_Y);
			officeGridV.lineTo(x, DIVIDER_Y);
		}
		officeGridV.stroke({ width: 1, color: PAL.floorLine, alpha: 0.25 });
		this.floorLayer.addChild(officeGrid);
		this.floorLayer.addChild(officeGridV);

		// === DIVIDER LINES ===
		const dividerLines = new Graphics();
		dividerLines.moveTo(0, DIVIDER_Y);
		dividerLines.lineTo(SCENE_WIDTH, DIVIDER_Y);
		dividerLines.stroke({ width: 2, color: PAL.dividerLine, alpha: 0.7 });
		dividerLines.moveTo(0, SERVER_Y);
		dividerLines.lineTo(SCENE_WIDTH, SERVER_Y);
		dividerLines.stroke({ width: 1, color: PAL.dividerLine, alpha: 0.4 });
		this.floorLayer.addChild(dividerLines);

		// === SIDE WALLS ===
		const sideWalls = new Graphics();
		sideWalls.rect(0, 0, 10, SCENE_HEIGHT);
		sideWalls.rect(SCENE_WIDTH - 10, 0, 10, SCENE_HEIGHT);
		sideWalls.fill(PAL.sideWall);
		this.floorLayer.addChild(sideWalls);

		// === SERVER ROOM GRID ===
		const serverGrid = new Graphics();
		for (let y = SERVER_Y + TILE; y < SCENE_HEIGHT; y += TILE) {
			serverGrid.moveTo(0, y);
			serverGrid.lineTo(SCENE_WIDTH, y);
		}
		serverGrid.stroke({ width: 1, color: PAL.serverLine, alpha: 0.25 });

		const serverGridV = new Graphics();
		for (let x = TILE * 2; x < SCENE_WIDTH; x += TILE * 2) {
			serverGridV.moveTo(x, SERVER_Y);
			serverGridV.lineTo(x, SCENE_HEIGHT);
		}
		serverGridV.stroke({ width: 1, color: PAL.serverLine, alpha: 0.15 });
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
		labelBg.fill({ color: 0x000000, alpha: 0.35 });
		labelText.x = 16 + padding;
		labelText.y = 16 + 4;
		labelText.alpha = 0.8;
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
		srLabelBg.fill({ color: 0x000000, alpha: 0.3 });
		srLabelText.x = 16 + padding;
		srLabelText.y = DIVIDER_Y + 5 + 3;
		srLabelText.alpha = 0.6;
		this.floorLayer.addChild(srLabelBg);
		this.floorLayer.addChild(srLabelText);
	}

	/** Draw warm wood-toned workstation clusters (desks, monitors, chairs) */
	drawWorkstations(): void {
		for (const ws of WORKSTATIONS) {
			const desk = new Graphics();

			// Desk surface (warm wood)
			desk.roundRect(ws.desk.x, ws.desk.y, ws.desk.w, ws.desk.h, 3);
			desk.fill(PAL.deskTop);

			// Desk front edge (3D depth cue)
			desk.rect(ws.desk.x, ws.desk.y + ws.desk.h, ws.desk.w, 5);
			desk.fill(PAL.deskFront);

			// Desk bottom edge shadow
			desk.rect(ws.desk.x + 2, ws.desk.y + ws.desk.h + 5, ws.desk.w - 4, 2);
			desk.fill(PAL.deskEdge);

			// Monitor body
			desk.roundRect(ws.monitor.x, ws.monitor.y, 26, 18, 2);
			desk.fill(PAL.screenFrame);

			// Monitor screen with project color
			desk.roundRect(ws.monitor.x + 2, ws.monitor.y + 2, 22, 14, 1);
			desk.fill({ color: ws.screenColor, alpha: 0.2 });

			// Monitor stand
			desk.rect(ws.monitor.x + 10, ws.monitor.y + 18, 6, 4);
			desk.fill(PAL.screenFrame);

			// Chair back (semi-circle)
			desk.roundRect(
				ws.chair.cx - 10,
				ws.chair.cy - 6,
				20,
				8,
				4,
			);
			desk.fill(PAL.chairBack);

			// Chair seat
			desk.circle(ws.chair.cx, ws.chair.cy + 4, 9);
			desk.fill(PAL.chairSeat);

			// Chair legs (small dots)
			desk.circle(ws.chair.cx - 6, ws.chair.cy + 12, 2);
			desk.circle(ws.chair.cx + 6, ws.chair.cy + 12, 2);
			desk.fill(PAL.chairLeg);

			this.floorLayer.addChild(desk);
		}
	}

	/** Draw opaque backing panels behind each infra position */
	drawInfraBackgrounds(): void {
		for (const infra of INFRA) {
			const panel = new Graphics();
			panel.roundRect(
				infra.position.x - 4,
				infra.position.y - 4,
				56,
				56,
				6,
			);
			panel.fill(PAL.infraBg);
			panel.roundRect(
				infra.position.x - 4,
				infra.position.y - 4,
				56,
				56,
				6,
			);
			panel.stroke({ width: 1, color: PAL.infraBorder, alpha: 0.4 });
			this.decorLayer.addChild(panel);
		}
	}

	/** Draw all room decorations using pixel-art Graphics (no PNG sprites) */
	drawRoomDecor(): void {
		this.decorLayer.removeChildren();

		// Infra backgrounds (in server room)
		this.drawInfraBackgrounds();

		// === BACK WALL DECORATIONS ===
		const wallDecor = new Graphics();

		// Bookshelves
		drawBookshelf(wallDecor, 30, 0, 50, 58);
		drawBookshelf(wallDecor, 770, 0, 50, 58);
		drawBookshelf(wallDecor, 1190, 0, 50, 58);

		// Windows
		drawWindow(wallDecor, 160, 6, 70, 46);
		drawWindow(wallDecor, 600, 6, 70, 46);
		drawWindow(wallDecor, 920, 6, 70, 46);

		// Whiteboard
		drawWhiteboard(wallDecor, 340, 4, 90, 50);

		// Clock
		drawClock(wallDecor, 510, 30, 14);

		// Lamps on desks (right side of each desk)
		drawLamp(wallDecor, 240, 120);
		drawLamp(wallDecor, 580, 120);

		this.decorLayer.addChild(wallDecor);

		// === FLOOR DECORATIONS ===
		const floorDecor = new Graphics();

		// Corner plants (large)
		drawPlant(floorDecor, 18, 68, 1.4);
		drawPlant(floorDecor, 1230, 68, 1.4);
		drawPlant(floorDecor, 18, 380, 1.4);
		drawPlant(floorDecor, 1230, 380, 1.4);

		// Mid-room plants (smaller)
		drawPlant(floorDecor, 440, 370, 1.0);
		drawPlant(floorDecor, 760, 250, 1.0);

		// Water cooler
		drawWaterCooler(floorDecor, 1090, 245);

		this.decorLayer.addChild(floorDecor);

		// === SERVER ROOM DECORATIONS ===
		const serverDecor = new Graphics();

		// Decorative server racks on sides
		drawServerRack(serverDecor, 24, 478, 32, 52);
		drawServerRack(serverDecor, 1218, 478, 32, 52);
		drawServerRack(serverDecor, 24, 548, 32, 52);
		drawServerRack(serverDecor, 1218, 548, 32, 52);

		this.decorLayer.addChild(serverDecor);
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
