import { Container, Graphics, Rectangle, Sprite, Text, TextStyle, Ticker } from "pixi.js";
import type { InfraConfig, InfraType } from "@/lib/types";
import {
	loadTexture,
	loadFurnitureFrames,
	getFurnitureSpritePath,
	isAnimatedFurniture,
} from "@/lib/sprite-loader";

const DISPLAY_SIZE = 48;
const HOVER_LERP = 0.15;

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
	private fallbackBody: Graphics | null = null;
	private fallbackIcon: Text | null = null;
	private spriteDisplay: Sprite | null = null;
	private nameLabel: Text;
	private glowGraphics: Graphics;
	private active = false;
	private animatedFrames: import("pixi.js").Texture[] | null = null;
	private frameIndex = 0;
	private ticker: Ticker | null = null;

	// Smooth hover
	private targetScale = 1;
	private currentScale = 1;

	constructor(config: InfraConfig) {
		this.config = config;
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";
		this.container.hitArea = new Rectangle(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

		// Z-index for depth sorting (bottom edge)
		this.container.zIndex = config.position.y + DISPLAY_SIZE;

		const shape = TYPE_SHAPES[config.type];

		// Glow effect (behind everything)
		this.glowGraphics = new Graphics();
		this.container.addChild(this.glowGraphics);

		// Fallback body
		this.fallbackBody = new Graphics();
		this.fallbackBody.roundRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE, 6);
		this.fallbackBody.fill(shape.baseColor);

		// Type icon
		this.fallbackIcon = new Text({
			text: shape.icon,
			style: new TextStyle({
				fontFamily: "Courier New",
				fontSize: 18,
				fill: 0xffffff,
				fontWeight: "bold",
			}),
		});
		this.fallbackIcon.anchor.set(0.5);
		this.fallbackIcon.x = DISPLAY_SIZE / 2;
		this.fallbackIcon.y = DISPLAY_SIZE / 2;

		this.container.addChild(this.fallbackBody);
		this.container.addChild(this.fallbackIcon);

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
		this.nameLabel.x = DISPLAY_SIZE / 2;
		this.nameLabel.y = DISPLAY_SIZE + 4;
		this.nameLabel.alpha = 0;
		this.container.addChild(this.nameLabel);

		// Smooth hover events
		this.container.on("pointerover", () => {
			this.nameLabel.alpha = 1;
			this.targetScale = 1.06;
		});
		this.container.on("pointerout", () => {
			this.nameLabel.alpha = 0;
			this.targetScale = 1;
		});

		// Start hover animation ticker
		this.ticker = new Ticker();
		this.ticker.add(() => this.animateHover());
		this.ticker.start();

		// Load sprite sheet async
		this.loadSprite();
	}

	private animateHover(): void {
		this.currentScale += (this.targetScale - this.currentScale) * HOVER_LERP;
		if (Math.abs(this.currentScale - this.targetScale) < 0.001) {
			this.currentScale = this.targetScale;
		}
		this.container.scale.set(this.currentScale);
	}

	private async loadSprite(): Promise<void> {
		const path = getFurnitureSpritePath(this.config.id, this.config.type);
		if (!path) return;

		if (isAnimatedFurniture(this.config.type)) {
			const frames = await loadFurnitureFrames(path);
			if (!frames || frames.length === 0) return;

			this.animatedFrames = frames;
			this.spriteDisplay = new Sprite(frames[0]);
			this.spriteDisplay.width = DISPLAY_SIZE;
			this.spriteDisplay.height = DISPLAY_SIZE;

			// Animate frames when active
			this.ticker?.add(() => this.animateFrames());
		} else {
			const texture = await loadTexture(path);
			if (!texture) return;

			this.spriteDisplay = new Sprite(texture);
			this.spriteDisplay.width = DISPLAY_SIZE;
			this.spriteDisplay.height = DISPLAY_SIZE;
		}

		// Remove fallback
		if (this.fallbackBody) {
			this.container.removeChild(this.fallbackBody);
			this.fallbackBody.destroy();
			this.fallbackBody = null;
		}
		if (this.fallbackIcon) {
			this.container.removeChild(this.fallbackIcon);
			this.fallbackIcon.destroy();
			this.fallbackIcon = null;
		}

		// Insert sprite after glow but before name label
		this.container.addChildAt(this.spriteDisplay, 1);
	}

	private animateFrames(): void {
		if (!this.animatedFrames || !this.spriteDisplay || !this.active) return;

		this.frameIndex = (this.frameIndex + 1) % this.animatedFrames.length;
		this.spriteDisplay.texture = this.animatedFrames[this.frameIndex];
	}

	setActive(active: boolean): void {
		if (this.active === active) return;
		this.active = active;

		this.glowGraphics.clear();
		if (active) {
			this.glowGraphics.roundRect(-3, -3, DISPLAY_SIZE + 6, DISPLAY_SIZE + 6, 8);
			this.glowGraphics.stroke({ width: 2, color: 0x22c55e, alpha: 0.8 });
		}

		if (this.fallbackBody) {
			const shape = TYPE_SHAPES[this.config.type];
			this.fallbackBody.clear();
			this.fallbackBody.roundRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE, 6);
			this.fallbackBody.fill(shape.baseColor);
		}
	}

	/** Click pulse effect */
	pulse(): void {
		this.targetScale = 1.12;
		setTimeout(() => {
			this.targetScale = 1;
		}, 150);
	}

	destroy(): void {
		this.ticker?.stop();
		this.ticker?.destroy();
		this.container.destroy({ children: true });
	}
}
