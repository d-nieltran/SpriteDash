import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { SCENE_WIDTH, SCENE_HEIGHT, ZONES, HUD_HEIGHT } from "@/lib/scene-layout";
import type { Theme } from "@/lib/types";

export class SceneManager {
	app: Application;
	floorLayer: Container;
	furnitureLayer: Container;
	spriteLayer: Container;
	particleLayer: Container;
	connectionLayer: Container;
	private initialized = false;

	constructor() {
		this.app = new Application();
		this.floorLayer = new Container();
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
		this.app.stage.addChild(this.connectionLayer);
		this.app.stage.addChild(this.furnitureLayer);
		this.app.stage.addChild(this.spriteLayer);
		this.app.stage.addChild(this.particleLayer);

		this.initialized = true;
	}

	drawFloor(theme: Theme): void {
		this.floorLayer.removeChildren();

		for (const zone of ZONES) {
			const floor = new Graphics();
			const color =
				theme.floorColors[zone.id as keyof typeof theme.floorColors];
			floor.rect(zone.x, zone.y, zone.width, zone.height);
			floor.fill(color);

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

			this.floorLayer.addChild(floor);
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

	destroy(): void {
		this.app.destroy(true);
		this.initialized = false;
	}
}
