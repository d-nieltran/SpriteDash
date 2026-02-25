import {
	Application,
	Container,
	Graphics,
	Text,
	TextStyle,
	TilingSprite,
} from "pixi.js";
import {
	SCENE_WIDTH,
	SCENE_HEIGHT,
	ROOM,
	DECORATIONS,
} from "@/lib/scene-layout";
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

	async drawFloor(theme: Theme): Promise<void> {
		this.floorLayer.removeChildren();

		// Single unified floor
		const floor = new Graphics();
		const hex = Number.parseInt(theme.floorColor.replace("#", ""), 16);
		floor.rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
		floor.fill(hex);
		this.floorLayer.addChild(floor);

		// Subtle wall strip at top
		const wallStrip = new Graphics();
		wallStrip.rect(0, 0, SCENE_WIDTH, 40);
		wallStrip.fill({ color: 0xffffff, alpha: 0.03 });
		this.floorLayer.addChild(wallStrip);

		// Subtle server room area at bottom
		const serverArea = new Graphics();
		serverArea.rect(0, 500, SCENE_WIDTH, 220);
		serverArea.fill({ color: 0x000000, alpha: 0.08 });
		this.floorLayer.addChild(serverArea);

		// Tiled floor overlay
		const tileTexture = theme.floorTile
			? await loadTexture(theme.floorTile)
			: null;
		if (tileTexture) {
			const tilingSprite = new TilingSprite({
				texture: tileTexture,
				width: SCENE_WIDTH,
				height: SCENE_HEIGHT,
			});
			tilingSprite.tileScale.set(0.03);
			tilingSprite.alpha = 0.035;
			this.floorLayer.addChild(tilingSprite);
		}

		// Room label badge
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
		labelBg.roundRect(12, 10, labelW, labelH, 4);
		labelBg.fill({ color: 0x000000, alpha: 0.3 });
		labelText.x = 12 + padding;
		labelText.y = 10 + 4;
		labelText.alpha = 0.7;
		this.floorLayer.addChild(labelBg);
		this.floorLayer.addChild(labelText);
	}

	async loadDecorations(): Promise<void> {
		this.decorLayer.removeChildren();

		for (const decor of DECORATIONS) {
			const texture = await loadTexture(decor.sprite);
			if (!texture) continue;

			const sprite = new (await import("pixi.js")).Sprite(texture);
			sprite.x = decor.x;
			sprite.y = decor.y;
			sprite.width = decor.width;
			sprite.height = decor.height;
			sprite.alpha = 0.7;
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

	/** Register a click handler on the PixiJS stage (root level).
	 *  Uses getLocalPosition to convert through the world transform. */
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
