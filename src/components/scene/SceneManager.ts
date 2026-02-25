import {
	Application,
	Container,
	Graphics,
	Sprite,
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
	floorLayer: Container;
	decorLayer: Container;
	furnitureLayer: Container;
	spriteLayer: Container;
	particleLayer: Container;
	connectionLayer: Container;
	private initialized = false;

	constructor() {
		this.app = new Application();
		this.floorLayer = new Container();
		this.decorLayer = new Container();
		this.furnitureLayer = new Container();
		this.spriteLayer = new Container();
		this.particleLayer = new Container();
		this.connectionLayer = new Container();
	}

	async init(canvas: HTMLCanvasElement): Promise<void> {
		if (this.initialized) return;

		await this.app.init({
			canvas,
			width: SCENE_WIDTH,
			height: SCENE_HEIGHT,
			background: 0x1a1c2c,
			antialias: false,
			resolution: 1,
		});

		// Add layers in z-order
		this.app.stage.addChild(this.floorLayer);
		this.app.stage.addChild(this.decorLayer);
		this.app.stage.addChild(this.connectionLayer);
		this.app.stage.addChild(this.furnitureLayer);
		this.app.stage.addChild(this.spriteLayer);
		this.app.stage.addChild(this.particleLayer);

		this.initialized = true;
	}

	async drawFloor(theme: Theme): Promise<void> {
		this.floorLayer.removeChildren();

		for (const zone of ZONES) {
			// Try loading tile texture for tiled floor
			const tilePath =
				theme.floorTiles[zone.id as keyof typeof theme.floorTiles];
			const tileTexture = tilePath ? await loadTexture(tilePath) : null;

			if (tileTexture) {
				// Tiled floor rendering
				const tilingSprite = new TilingSprite({
					texture: tileTexture,
					width: zone.width,
					height: zone.height,
				});
				tilingSprite.x = zone.x;
				tilingSprite.y = zone.y;
				this.floorLayer.addChild(tilingSprite);
			} else {
				// Fallback: solid color fill
				const floor = new Graphics();
				const color =
					theme.floorColors[zone.id as keyof typeof theme.floorColors];
				floor.rect(zone.x, zone.y, zone.width, zone.height);
				floor.fill(color);
				this.floorLayer.addChild(floor);
			}

			// Wall base strip at top of zone
			const wallTexture = theme.wallBase
				? await loadTexture(theme.wallBase)
				: null;
			if (wallTexture) {
				const wallStrip = new TilingSprite({
					texture: wallTexture,
					width: zone.width,
					height: 16,
				});
				wallStrip.x = zone.x;
				wallStrip.y = zone.y;
				this.floorLayer.addChild(wallStrip);
			}

			// Zone label
			const label = new Text({
				text: zone.label,
				style: new TextStyle({
					fontFamily: "Courier New",
					fontSize: 12,
					fill: 0xffffff,
					fontWeight: "bold",
					letterSpacing: 1,
				}),
			});
			label.x = zone.x + 10;
			label.y = zone.y + 8;
			label.alpha = 0.6;
			this.floorLayer.addChild(label);
		}

		// Zone dividers
		const dividers = new Graphics();
		dividers.setStrokeStyle({ width: 1, color: 0x38394b });
		for (const zone of ZONES) {
			dividers.moveTo(zone.x, zone.y);
			dividers.lineTo(zone.x, zone.y + zone.height);
		}
		dividers.stroke();
		this.floorLayer.addChild(dividers);
	}

	async loadDecorations(): Promise<void> {
		this.decorLayer.removeChildren();

		for (const decor of DECORATIONS) {
			const texture = await loadTexture(decor.sprite);
			if (!texture) continue;

			const sprite = new Sprite(texture);
			sprite.x = decor.x;
			sprite.y = decor.y;
			sprite.width = decor.width * 2; // 2x scale for display
			sprite.height = decor.height * 2;
			this.decorLayer.addChild(sprite);
		}
	}

	destroy(): void {
		this.app.destroy(true);
		this.initialized = false;
	}
}
