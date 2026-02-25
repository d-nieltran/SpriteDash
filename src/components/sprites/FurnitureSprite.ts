import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { InfraConfig, InfraType } from "@/lib/types";

const SIZE = 40;

const TYPE_SHAPES: Record<InfraType, { icon: string; baseColor: number }> = {
	d1: { icon: "DB", baseColor: 0x64748b },
	kv: { icon: "KV", baseColor: 0x8b5cf6 },
	r2: { icon: "R2", baseColor: 0xf97316 },
	queue: { icon: "Q", baseColor: 0x06b6d4 },
	ai: { icon: "AI", baseColor: 0xfacc15 },
};

export class FurnitureSprite {
	container: Container;
	config: InfraConfig;
	private body: Graphics;
	private nameLabel: Text;
	private active = false;

	constructor(config: InfraConfig) {
		this.config = config;
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";

		const shape = TYPE_SHAPES[config.type];

		// Body
		this.body = new Graphics();
		this.body.roundRect(0, 0, SIZE, SIZE, 4);
		this.body.fill(shape.baseColor);

		// Type icon
		const icon = new Text({
			text: shape.icon,
			style: new TextStyle({
				fontFamily: "Courier New",
				fontSize: 14,
				fill: 0xffffff,
				fontWeight: "bold",
			}),
		});
		icon.anchor.set(0.5);
		icon.x = SIZE / 2;
		icon.y = SIZE / 2;

		// Name label (shown on hover)
		this.nameLabel = new Text({
			text: config.name,
			style: new TextStyle({
				fontFamily: "Courier New",
				fontSize: 8,
				fill: 0xffffff,
				align: "center",
			}),
		});
		this.nameLabel.anchor.set(0.5, 0);
		this.nameLabel.x = SIZE / 2;
		this.nameLabel.y = SIZE + 4;
		this.nameLabel.alpha = 0;

		this.container.addChild(this.body);
		this.container.addChild(icon);
		this.container.addChild(this.nameLabel);

		// Hover
		this.container.on("pointerover", () => {
			this.nameLabel.alpha = 1;
			this.container.scale.set(1.05);
		});
		this.container.on("pointerout", () => {
			this.nameLabel.alpha = 0;
			this.container.scale.set(1);
		});
	}

	setActive(active: boolean): void {
		if (this.active === active) return;
		this.active = active;

		this.body.clear();
		const shape = TYPE_SHAPES[this.config.type];
		this.body.roundRect(0, 0, SIZE, SIZE, 4);
		this.body.fill(shape.baseColor);

		if (active) {
			// Glow effect
			this.body.roundRect(-2, -2, SIZE + 4, SIZE + 4, 6);
			this.body.stroke({ width: 2, color: 0x22c55e, alpha: 0.8 });
		}
	}

	onClick(handler: () => void): void {
		this.container.on("pointerdown", handler);
	}

	destroy(): void {
		this.container.destroy({ children: true });
	}
}
