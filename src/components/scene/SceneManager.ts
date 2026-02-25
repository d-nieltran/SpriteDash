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
	ZONES,
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

		for (const zone of ZONES) {
			// Gradient-style floor: solid color with subtle variation
			const floor = new Graphics();
			const color = theme.floorColors[zone.id as keyof typeof theme.floorColors];
			const hex = Number.parseInt(color.replace("#", ""), 16);

			// Main floor
			floor.rect(zone.x, zone.y, zone.width, zone.height);
			floor.fill(hex);

			// Subtle lighter strip at top (wall area feel)
			const wallStrip = new Graphics();
			wallStrip.rect(zone.x, zone.y, zone.width, 40);
			wallStrip.fill({ color: 0xffffff, alpha: 0.03 });

			this.floorLayer.addChild(floor);
			this.floorLayer.addChild(wallStrip);

			// Try tiled floor overlay if texture exists
			const tilePath = theme.floorTiles[zone.id as keyof typeof theme.floorTiles];
			const tileTexture = tilePath ? await loadTexture(tilePath) : null;
			if (tileTexture) {
				const tilingSprite = new TilingSprite({
					texture: tileTexture,
					width: zone.width,
					height: zone.height,
				});
				tilingSprite.x = zone.x;
				tilingSprite.y = zone.y;
				tilingSprite.alpha = 0.3;
				this.floorLayer.addChild(tilingSprite);
			}

			// Zone label — styled badge
			const labelBg = new Graphics();
			const labelText = new Text({
				text: zone.label,
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
			labelBg.roundRect(zone.x + 12, zone.y + 10, labelW, labelH, 4);
			labelBg.fill({ color: 0x000000, alpha: 0.3 });
			labelText.x = zone.x + 12 + padding;
			labelText.y = zone.y + 10 + 4;
			labelText.alpha = 0.7;

			this.floorLayer.addChild(labelBg);
			this.floorLayer.addChild(labelText);
		}

		// Zone dividers — subtle gradient lines
		for (let i = 1; i < ZONES.length; i++) {
			const zone = ZONES[i];
			const divider = new Graphics();
			divider.rect(zone.x - 1, zone.y, 2, zone.height);
			divider.fill({ color: 0xffffff, alpha: 0.04 });
			this.floorLayer.addChild(divider);
		}
	}

	async loadDecorations(): Promise<void> {
		this.decorLayer.removeChildren();

		for (const decor of DECORATIONS) {
			const texture = await loadTexture(decor.sprite);
			if (!texture) continue;

			const sprite = new (await import("pixi.js")).Sprite(texture);
			sprite.x = decor.x;
			sprite.y = decor.y;
			sprite.width = decor.width * 2;
			sprite.height = decor.height * 2;
			this.decorLayer.addChild(sprite);
		}
	}

	destroy(): void {
		this.app.destroy(true);
		this.initialized = false;
	}
}
