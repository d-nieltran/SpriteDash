import {
	Container,
	Graphics,
	Sprite,
	Text,
	TextStyle,
	Texture,
	Ticker,
} from "pixi.js";
import type { WorkerConfig, WorkerStatus, Position } from "@/lib/types";
import {
	loadWorkerFrames,
	getWorkerSpriteName,
	type WorkerFrames,
} from "@/lib/sprite-loader";

const DISPLAY_SIZE = 64; // 32px base × 2x scale
const LABEL_OFFSET_Y = -14;
const MOVE_SPEED = 2;

export class WorkerSprite {
	container: Container;
	config: WorkerConfig;
	private spriteDisplay: Sprite | null = null;
	private fallbackBody: Graphics | null = null;
	private nameLabel: Text;
	private statusDot: Graphics;
	private currentStatus: WorkerStatus = "idle";
	private homePosition: Position;
	private moveTarget: Position | null = null;
	private animationPhase = 0;
	private frameIndex = 0;
	private frameTick = 0;
	private ticker: Ticker;
	private frames: WorkerFrames | null = null;

	constructor(config: WorkerConfig) {
		this.config = config;
		this.homePosition = { ...config.position };
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";

		// Start with fallback placeholder — sprite sheet loaded async
		this.fallbackBody = new Graphics();
		this.drawFallbackBody();
		this.container.addChild(this.fallbackBody);

		// Name label
		this.nameLabel = new Text({
			text: config.character,
			style: new TextStyle({
				fontFamily: "Courier New",
				fontSize: 9,
				fill: 0xffffff,
				align: "center",
			}),
		});
		this.nameLabel.anchor.set(0.5, 1);
		this.nameLabel.x = DISPLAY_SIZE / 2;
		this.nameLabel.y = LABEL_OFFSET_Y;
		this.nameLabel.alpha = 0;

		// Status dot
		this.statusDot = new Graphics();
		this.drawStatusDot();
		this.statusDot.x = DISPLAY_SIZE - 6;
		this.statusDot.y = 6;

		this.container.addChild(this.nameLabel);
		this.container.addChild(this.statusDot);

		// Hover events
		this.container.on("pointerover", () => {
			this.nameLabel.alpha = 1;
			this.container.scale.set(1.1);
		});
		this.container.on("pointerout", () => {
			this.nameLabel.alpha = 0;
			this.container.scale.set(1);
		});

		// Animation ticker
		this.ticker = new Ticker();
		this.ticker.add(() => this.animate());
		this.ticker.start();

		// Load sprite sheet async
		this.loadSpriteSheet();
	}

	private async loadSpriteSheet(): Promise<void> {
		const name = getWorkerSpriteName(this.config.id);
		const frames = await loadWorkerFrames(name);
		if (!frames) return; // Keep fallback

		this.frames = frames;

		// Create sprite display
		this.spriteDisplay = new Sprite(frames.idle[0]);
		this.spriteDisplay.width = DISPLAY_SIZE;
		this.spriteDisplay.height = DISPLAY_SIZE;

		// Remove fallback and add sprite
		if (this.fallbackBody) {
			this.container.removeChild(this.fallbackBody);
			this.fallbackBody.destroy();
			this.fallbackBody = null;
		}
		this.container.addChildAt(this.spriteDisplay, 0);
	}

	private drawFallbackBody(): void {
		if (!this.fallbackBody) return;
		this.fallbackBody.clear();
		const color = Number.parseInt(this.config.color.replace("#", ""), 16);

		// Body rectangle
		this.fallbackBody.roundRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE, 8);
		this.fallbackBody.fill(color);

		// Eyes
		this.fallbackBody.circle(DISPLAY_SIZE * 0.35, DISPLAY_SIZE * 0.32, 6);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.65, DISPLAY_SIZE * 0.32, 6);
		this.fallbackBody.fill(0xffffff);

		// Pupils
		this.fallbackBody.circle(DISPLAY_SIZE * 0.37, DISPLAY_SIZE * 0.32, 3);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.67, DISPLAY_SIZE * 0.32, 3);
		this.fallbackBody.fill(0x1a1c2c);

		// Mouth
		this.fallbackBody.moveTo(DISPLAY_SIZE * 0.35, DISPLAY_SIZE * 0.55);
		this.fallbackBody.quadraticCurveTo(
			DISPLAY_SIZE * 0.5,
			DISPLAY_SIZE * 0.68,
			DISPLAY_SIZE * 0.65,
			DISPLAY_SIZE * 0.55,
		);
		this.fallbackBody.stroke({ width: 2, color: 0x1a1c2c });
	}

	private drawStatusDot(): void {
		this.statusDot.clear();
		const colors: Record<WorkerStatus, number> = {
			idle: 0x94a3b8,
			working: 0x22c55e,
			error: 0xef4444,
			celebrate: 0xfacc15,
		};
		this.statusDot.circle(0, 0, 5);
		this.statusDot.fill(colors[this.currentStatus]);
	}

	private getFramesPerTick(): number {
		switch (this.currentStatus) {
			case "working":
				return 12; // ~200ms at 60fps
			case "error":
				return 24; // ~400ms
			case "celebrate":
				return 18; // ~300ms
			default:
				return 30; // ~500ms for idle
		}
	}

	private animate(): void {
		this.animationPhase += 0.05;

		// Sprite sheet frame animation
		if (this.frames && this.spriteDisplay) {
			this.frameTick++;
			if (this.frameTick >= this.getFramesPerTick()) {
				this.frameTick = 0;
				const statusFrames = this.frames[this.currentStatus];
				this.frameIndex = (this.frameIndex + 1) % statusFrames.length;
				this.spriteDisplay.texture = statusFrames[this.frameIndex];
			}
		}

		// Movement animations (apply to both sprite and fallback modes)
		const target = this.spriteDisplay ?? this.fallbackBody;
		if (!target) return;

		if (this.currentStatus === "working") {
			target.y = Math.sin(this.animationPhase * 3) * 3;
		} else if (this.currentStatus === "error") {
			target.x = Math.sin(this.animationPhase * 10) * 2;
		} else if (this.currentStatus === "celebrate") {
			target.y = -Math.abs(Math.sin(this.animationPhase * 4)) * 8;
		} else {
			target.y = Math.sin(this.animationPhase) * 1;
			target.x = this.spriteDisplay ? 0 : 0;
		}

		// Position movement towards target
		if (this.moveTarget) {
			const dx = this.moveTarget.x - this.container.x;
			const dy = this.moveTarget.y - this.container.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < MOVE_SPEED) {
				this.container.x = this.moveTarget.x;
				this.container.y = this.moveTarget.y;
				this.moveTarget = null;
			} else {
				this.container.x += (dx / dist) * MOVE_SPEED;
				this.container.y += (dy / dist) * MOVE_SPEED;
			}
		}
	}

	setStatus(status: WorkerStatus): void {
		const prev = this.currentStatus;
		this.currentStatus = status;
		this.frameIndex = 0;
		this.frameTick = 0;
		this.drawStatusDot();

		// Reset position offsets on status change
		if (this.spriteDisplay) {
			this.spriteDisplay.x = 0;
			this.spriteDisplay.y = 0;
		}
		if (this.fallbackBody) {
			this.fallbackBody.x = 0;
			this.fallbackBody.y = 0;
		}

		// Play celebrate briefly on working → idle transition
		if (prev === "working" && status === "idle") {
			this.currentStatus = "celebrate";
			this.frameIndex = 0;
			this.drawStatusDot();
			setTimeout(() => {
				this.currentStatus = "idle";
				this.frameIndex = 0;
				this.drawStatusDot();
			}, 1200);
		}
	}

	moveTo(target: Position): void {
		this.moveTarget = target;
	}

	returnHome(): void {
		this.moveTarget = { ...this.homePosition };
	}

	onClick(handler: () => void): void {
		this.container.on("pointerdown", handler);
	}

	destroy(): void {
		this.ticker.stop();
		this.ticker.destroy();
		this.container.destroy({ children: true });
	}
}
