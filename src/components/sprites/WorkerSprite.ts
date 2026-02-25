import {
	Container,
	Graphics,
	Rectangle,
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

const DISPLAY_SIZE = 64;
const LABEL_OFFSET_Y = -10;
const MOVE_SPEED = 1.5;
const PAUSE_MIN = 80; // ticks at infra before moving on
const PAUSE_MAX = 140;

const SPEECH_LINES: Record<string, string[]> = {
	idle: ["Waiting for work...", "Taking a break", "All caught up!", "☕ Coffee time"],
	working: ["On it!", "Syncing data...", "Processing...", "Almost done!"],
	error: ["Something broke!", "Need help here!", "Retrying...", "Ugh, errors!"],
	celebrate: ["Done! 🎉", "Nailed it!", "Ship it!", "All green ✓"],
};

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

	// Behavior system
	private infraPositions: Position[] = [];
	private pauseTimer = 0;
	private lastVisitedIndex = -1;
	private speechBubble: Container | null = null;
	private speechTimer = 0;

	constructor(config: WorkerConfig) {
		this.config = config;
		this.homePosition = { ...config.position };
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";
		this.container.hitArea = new Rectangle(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

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
		this.statusDot.x = DISPLAY_SIZE - 4;
		this.statusDot.y = 4;

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
		if (!frames) return;

		this.frames = frames;
		this.spriteDisplay = new Sprite(frames.idle[0]);
		this.spriteDisplay.width = DISPLAY_SIZE;
		this.spriteDisplay.height = DISPLAY_SIZE;

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
		this.fallbackBody.roundRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE, 6);
		this.fallbackBody.fill(color);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.35, DISPLAY_SIZE * 0.32, 4);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.65, DISPLAY_SIZE * 0.32, 4);
		this.fallbackBody.fill(0xffffff);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.37, DISPLAY_SIZE * 0.32, 2);
		this.fallbackBody.circle(DISPLAY_SIZE * 0.67, DISPLAY_SIZE * 0.32, 2);
		this.fallbackBody.fill(0x1a1c2c);
	}

	private drawStatusDot(): void {
		this.statusDot.clear();
		const colors: Record<WorkerStatus, number> = {
			idle: 0x94a3b8,
			working: 0x22c55e,
			error: 0xef4444,
			celebrate: 0xfacc15,
		};
		this.statusDot.circle(0, 0, 4);
		this.statusDot.fill(colors[this.currentStatus]);
	}

	private getFramesPerTick(): number {
		switch (this.currentStatus) {
			case "working":
				return 12;
			case "error":
				return 24;
			case "celebrate":
				return 18;
			default:
				return 30;
		}
	}

	private pickNextInfra(): void {
		if (this.infraPositions.length === 0) return;

		// Pick a different infra than last visited
		let idx: number;
		if (this.infraPositions.length === 1) {
			idx = 0;
		} else {
			do {
				idx = Math.floor(Math.random() * this.infraPositions.length);
			} while (idx === this.lastVisitedIndex);
		}
		this.lastVisitedIndex = idx;

		// Offset target so worker stands next to infra, not on top
		const infra = this.infraPositions[idx];
		this.moveTarget = {
			x: infra.x + (Math.random() > 0.5 ? -20 : 20),
			y: infra.y - 16,
		};
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

		const visual = this.spriteDisplay ?? this.fallbackBody;
		if (!visual) return;

		// Status-based micro-animations (applied to the visual, not the container)
		if (this.currentStatus === "working") {
			visual.y = Math.sin(this.animationPhase * 3) * 2;
		} else if (this.currentStatus === "error") {
			visual.x = Math.sin(this.animationPhase * 10) * 2;
		} else if (this.currentStatus === "celebrate") {
			visual.y = -Math.abs(Math.sin(this.animationPhase * 4)) * 6;
		} else {
			// Idle: subtle breathing
			visual.y = Math.sin(this.animationPhase) * 0.5;
			visual.x = 0;
		}

		// Working behavior: walk between infrastructure
		if (this.currentStatus === "working" && this.infraPositions.length > 0) {
			if (this.pauseTimer > 0) {
				// Paused at infra, "interacting"
				this.pauseTimer--;
			} else if (!this.moveTarget) {
				// Done pausing, pick next infra to visit
				this.pickNextInfra();
			}
		}

		// Speech bubble countdown
		if (this.speechBubble && this.speechTimer > 0) {
			this.speechTimer--;
			// Fade out in the last 30 frames
			if (this.speechTimer < 30) {
				this.speechBubble.alpha = this.speechTimer / 30;
			}
			if (this.speechTimer <= 0) {
				this.container.removeChild(this.speechBubble);
				this.speechBubble.destroy({ children: true });
				this.speechBubble = null;
			}
		}

		// Linear movement towards target
		if (this.moveTarget) {
			const dx = this.moveTarget.x - this.container.x;
			const dy = this.moveTarget.y - this.container.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < MOVE_SPEED) {
				this.container.x = this.moveTarget.x;
				this.container.y = this.moveTarget.y;
				this.moveTarget = null;
				// Arrived: start pause timer if working
				if (this.currentStatus === "working") {
					this.pauseTimer =
						PAUSE_MIN + Math.floor(Math.random() * (PAUSE_MAX - PAUSE_MIN));
				}
			} else {
				this.container.x += (dx / dist) * MOVE_SPEED;
				this.container.y += (dy / dist) * MOVE_SPEED;
			}
		}
	}

	/** Start walking between connected infrastructure */
	startWorking(infraPositions: Position[]): void {
		this.infraPositions = infraPositions;
		this.lastVisitedIndex = -1;
		this.pauseTimer = 0;
		this.pickNextInfra();
	}

	/** Stop moving and freeze at current position */
	stopMoving(): void {
		this.moveTarget = null;
		this.infraPositions = [];
		this.pauseTimer = 0;
	}

	setStatus(status: WorkerStatus): void {
		const prev = this.currentStatus;
		this.currentStatus = status;
		this.frameIndex = 0;
		this.frameTick = 0;
		this.drawStatusDot();

		// Reset visual offsets
		if (this.spriteDisplay) {
			this.spriteDisplay.x = 0;
			this.spriteDisplay.y = 0;
		}
		if (this.fallbackBody) {
			this.fallbackBody.x = 0;
			this.fallbackBody.y = 0;
		}

		// Working → idle: celebrate briefly, then return home
		if (prev === "working" && status === "idle") {
			this.stopMoving();
			this.currentStatus = "celebrate";
			this.frameIndex = 0;
			this.drawStatusDot();
			// Return home while celebrating
			this.moveTarget = { ...this.homePosition };
			setTimeout(() => {
				this.currentStatus = "idle";
				this.frameIndex = 0;
				this.drawStatusDot();
			}, 1200);
			return;
		}

		// Error: stop where you are
		if (status === "error") {
			this.stopMoving();
			return;
		}

		// Idle: return home
		if (status === "idle") {
			this.stopMoving();
			this.moveTarget = { ...this.homePosition };
		}
	}

	returnHome(): void {
		this.moveTarget = { ...this.homePosition };
	}

	/** Show a context-aware speech bubble above the worker */
	showSpeechBubble(): void {
		// Clear existing bubble
		if (this.speechBubble) {
			this.container.removeChild(this.speechBubble);
			this.speechBubble.destroy({ children: true });
			this.speechBubble = null;
		}

		const lines = SPEECH_LINES[this.currentStatus] ?? SPEECH_LINES.idle;
		const line = lines[Math.floor(Math.random() * lines.length)];

		const bubble = new Container();

		const text = new Text({
			text: line,
			style: new TextStyle({
				fontFamily: "Courier New",
				fontSize: 9,
				fill: 0x1a1c2c,
				align: "center",
			}),
		});

		const padX = 8;
		const padY = 4;
		const bg = new Graphics();
		bg.roundRect(0, 0, text.width + padX * 2, text.height + padY * 2, 6);
		bg.fill(0xffffff);
		// Small triangle pointer
		const cx = (text.width + padX * 2) / 2;
		const bh = text.height + padY * 2;
		bg.moveTo(cx - 4, bh);
		bg.lineTo(cx, bh + 5);
		bg.lineTo(cx + 4, bh);
		bg.closePath();
		bg.fill(0xffffff);

		text.x = padX;
		text.y = padY;
		bubble.addChild(bg);
		bubble.addChild(text);

		// Position above the sprite
		bubble.x = DISPLAY_SIZE / 2 - (text.width + padX * 2) / 2;
		bubble.y = -(text.height + padY * 2 + 10);

		this.container.addChild(bubble);
		this.speechBubble = bubble;
		this.speechTimer = 180; // ~3 seconds at 60fps
	}

	destroy(): void {
		this.ticker.stop();
		this.ticker.destroy();
		this.container.destroy({ children: true });
	}
}
