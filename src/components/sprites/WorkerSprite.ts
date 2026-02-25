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
const MOVE_SPEED = 1.5; // Used to calculate movement duration
const PAUSE_MIN = 80;
const PAUSE_MAX = 140;
const SITTING_OFFSET_Y = -8; // Visual offset when sitting at desk
const HOVER_LERP = 0.15; // Smooth hover transition speed

const SPEECH_LINES: Record<string, string[]> = {
	idle: ["Waiting for work...", "Taking a break", "All caught up!", "Coffee time"],
	working: ["On it!", "Syncing data...", "Processing...", "Almost done!"],
	error: ["Something broke!", "Need help here!", "Retrying...", "Ugh, errors!"],
	celebrate: ["Done!", "Nailed it!", "Ship it!", "All green"],
};

type WanderState =
	| "sitting"
	| "pausing"
	| "wandering"
	| "returning"
	| "interaction_walk"
	| "interaction_converse"
	| "interaction_return";

export class WorkerSprite {
	container: Container;
	config: WorkerConfig;
	private spriteDisplay: Sprite | null = null;
	private fallbackBody: Graphics | null = null;
	private nameLabel: Text;
	private statusDot: Graphics;
	private currentStatus: WorkerStatus = "idle";
	private homePosition: Position;
	private animationPhase = 0;
	private frameIndex = 0;
	private frameTick = 0;
	private ticker: Ticker;
	private frames: WorkerFrames | null = null;

	// Eased movement system
	private moveTarget: Position | null = null;
	private moveStartPos: Position | null = null;
	private moveProgress = 0;
	private moveDuration = 0;

	// Working behavior
	private infraPositions: Position[] = [];
	private pauseTimer = 0;
	private lastVisitedIndex = -1;

	// Speech bubble
	private speechBubble: Container | null = null;
	private speechTimer = 0;

	// Idle wander behavior (from pixel-agents pattern)
	private wanderState: WanderState = "sitting";
	private idleTimer = 300 + Math.random() * 600; // Initial 5-15s before first wander
	private wanderCount = 0;
	private maxWanders = 0;

	// Smooth hover
	private targetScale = 1;
	private currentScale = 1;

	// Interaction system
	private arrivalCallback: (() => void) | null = null;
	private deferredStatus: WorkerStatus | null = null;

	constructor(config: WorkerConfig) {
		this.config = config;
		this.homePosition = { ...config.position };
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";
		this.container.hitArea = new Rectangle(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

		// Z-index for depth sorting (bottom edge of sprite)
		this.container.zIndex = config.position.y + DISPLAY_SIZE;

		// Fallback placeholder
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

		// Smooth hover events (lerp instead of instant)
		this.container.on("pointerover", () => {
			this.nameLabel.alpha = 1;
			this.targetScale = 1.08;
		});
		this.container.on("pointerout", () => {
			this.nameLabel.alpha = 0;
			this.targetScale = 1;
		});

		// Animation ticker
		this.ticker = new Ticker();
		this.ticker.add(() => this.animate());
		this.ticker.start();

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

	/** Set a movement target with eased interpolation */
	private setMoveTarget(target: Position): void {
		this.moveStartPos = { x: this.container.x, y: this.container.y };
		this.moveTarget = { ...target };
		const dx = target.x - this.moveStartPos.x;
		const dy = target.y - this.moveStartPos.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		this.moveDuration = Math.max(dist / MOVE_SPEED, 15); // Min 15 frames
		this.moveProgress = 0;
	}

	/** Ease-in-out quadratic for smooth movement */
	private easeInOut(t: number): number {
		return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
	}

	private pickNextInfra(): void {
		if (this.infraPositions.length === 0) return;

		let idx: number;
		if (this.infraPositions.length === 1) {
			idx = 0;
		} else {
			do {
				idx = Math.floor(Math.random() * this.infraPositions.length);
			} while (idx === this.lastVisitedIndex);
		}
		this.lastVisitedIndex = idx;

		const infra = this.infraPositions[idx];
		this.setMoveTarget({
			x: infra.x + (Math.random() > 0.5 ? -20 : 20),
			y: infra.y - 16,
		});
	}

	/** Idle wander AI — workers occasionally walk around near their desk */
	private updateIdleWander(): void {
		switch (this.wanderState) {
			case "sitting":
				this.idleTimer--;
				if (this.idleTimer <= 0) {
					this.wanderState = "pausing";
					this.idleTimer = 60 + Math.random() * 120; // 1-3s pause before walking
					this.maxWanders = 1 + Math.floor(Math.random() * 3);
					this.wanderCount = 0;
				}
				break;

			case "pausing":
				this.idleTimer--;
				if (this.idleTimer <= 0) {
					// Pick random point near home
					this.wanderState = "wandering";
					const angle = Math.random() * Math.PI * 2;
					const dist = 30 + Math.random() * 50;
					this.setMoveTarget({
						x: this.homePosition.x + Math.cos(angle) * dist,
						y: Math.min(
							Math.max(
								this.homePosition.y + Math.sin(angle) * dist,
								70,
							),
							410,
						),
					});
				}
				break;

			case "wandering":
				if (!this.moveTarget) {
					// Arrived at wander point
					this.wanderCount++;
					if (this.wanderCount >= this.maxWanders) {
						this.wanderState = "returning";
						this.setMoveTarget({ ...this.homePosition });
					} else {
						this.wanderState = "pausing";
						this.idleTimer = 90 + Math.random() * 180; // 1.5-4.5s pause
					}
				}
				break;

			case "returning":
				if (!this.moveTarget) {
					// Back at desk
					this.wanderState = "sitting";
					this.idleTimer = 600 + Math.random() * 1200; // 10-30s rest
				}
				break;
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
				if (statusFrames && statusFrames.length > 0) {
					this.frameIndex = (this.frameIndex + 1) % statusFrames.length;
					this.spriteDisplay.texture = statusFrames[this.frameIndex];
				}
			}
		}

		const visual = this.spriteDisplay ?? this.fallbackBody;
		if (!visual) return;

		// Determine if sitting at desk
		const isSitting =
			this.currentStatus === "idle" &&
			this.wanderState === "sitting" &&
			!this.moveTarget;

		// Status-based micro-animations
		if (this.currentStatus === "working") {
			visual.y = Math.sin(this.animationPhase * 3) * 2;
			visual.x = 0;
		} else if (this.currentStatus === "error") {
			visual.x = Math.sin(this.animationPhase * 10) * 2;
			visual.y = 0;
		} else if (this.currentStatus === "celebrate") {
			visual.y = -Math.abs(Math.sin(this.animationPhase * 4)) * 6;
			visual.x = 0;
		} else if (isSitting) {
			// Sitting at desk: subtle breathing + sitting offset
			visual.y = Math.sin(this.animationPhase) * 0.5 + SITTING_OFFSET_Y;
			visual.x = 0;
		} else {
			// Standing/walking idle: walking bob
			visual.y = Math.sin(this.animationPhase * 2) * 1;
			visual.x = 0;
		}

		// Working behavior: walk between infrastructure
		if (this.currentStatus === "working" && this.infraPositions.length > 0) {
			if (this.pauseTimer > 0) {
				this.pauseTimer--;
			} else if (!this.moveTarget) {
				this.pickNextInfra();
			}
		}

		// Idle wander behavior (skip during interactions)
		if (
			this.currentStatus === "idle" &&
			this.wanderState !== "interaction_walk" &&
			this.wanderState !== "interaction_converse" &&
			this.wanderState !== "interaction_return"
		) {
			this.updateIdleWander();
		}

		// Speech bubble countdown
		if (this.speechBubble && this.speechTimer > 0) {
			this.speechTimer--;
			if (this.speechTimer < 30) {
				this.speechBubble.alpha = this.speechTimer / 30;
			}
			if (this.speechTimer <= 0) {
				this.container.removeChild(this.speechBubble);
				this.speechBubble.destroy({ children: true });
				this.speechBubble = null;
			}
		}

		// Eased movement toward target
		if (this.moveTarget && this.moveStartPos) {
			this.moveProgress += 1 / this.moveDuration;

			if (this.moveProgress >= 1) {
				this.container.x = this.moveTarget.x;
				this.container.y = this.moveTarget.y;
				this.moveTarget = null;
				this.moveStartPos = null;

				// Fire one-shot arrival callback (for interactions)
				if (this.arrivalCallback) {
					const cb = this.arrivalCallback;
					this.arrivalCallback = null;
					cb();
				}

				// Handle arrival
				if (this.currentStatus === "working") {
					this.pauseTimer =
						PAUSE_MIN +
						Math.floor(Math.random() * (PAUSE_MAX - PAUSE_MIN));
				}
			} else {
				const eased = this.easeInOut(this.moveProgress);
				this.container.x =
					this.moveStartPos.x +
					(this.moveTarget.x - this.moveStartPos.x) * eased;
				this.container.y =
					this.moveStartPos.y +
					(this.moveTarget.y - this.moveStartPos.y) * eased;
			}
		}

		// Update z-index for depth sorting (bottom edge of sprite)
		this.container.zIndex = this.container.y + DISPLAY_SIZE;

		// Smooth hover scale (lerp toward target)
		this.currentScale += (this.targetScale - this.currentScale) * HOVER_LERP;
		if (Math.abs(this.currentScale - this.targetScale) < 0.001) {
			this.currentScale = this.targetScale;
		}
		this.container.scale.set(this.currentScale);
	}

	/** Start walking between connected infrastructure */
	startWorking(infraPositions: Position[]): void {
		this.infraPositions = infraPositions;
		this.lastVisitedIndex = -1;
		this.pauseTimer = 0;
		// Reset wander state
		this.wanderState = "sitting";
		this.pickNextInfra();
	}

	/** Stop moving and freeze */
	stopMoving(): void {
		this.moveTarget = null;
		this.moveStartPos = null;
		this.moveProgress = 0;
		this.infraPositions = [];
		this.pauseTimer = 0;
	}

	setStatus(status: WorkerStatus): void {
		// Defer status changes during interactions
		if (
			this.wanderState === "interaction_walk" ||
			this.wanderState === "interaction_converse" ||
			this.wanderState === "interaction_return"
		) {
			this.deferredStatus = status;
			return;
		}

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
			this.setMoveTarget({ ...this.homePosition });
			setTimeout(() => {
				this.currentStatus = "idle";
				this.frameIndex = 0;
				this.drawStatusDot();
				// Reset wander timer
				this.wanderState = "sitting";
				this.idleTimer = 300 + Math.random() * 600;
			}, 1200);
			return;
		}

		// Error: stop where you are
		if (status === "error") {
			this.stopMoving();
			this.wanderState = "sitting";
			return;
		}

		// Idle: return home and reset wander
		if (status === "idle") {
			this.stopMoving();
			this.setMoveTarget({ ...this.homePosition });
			this.wanderState = "returning";
		}
	}

	returnHome(): void {
		this.setMoveTarget({ ...this.homePosition });
	}

	/** Show a context-aware speech bubble + click pulse */
	showSpeechBubble(): void {
		// Clear existing bubble
		if (this.speechBubble) {
			this.container.removeChild(this.speechBubble);
			this.speechBubble.destroy({ children: true });
			this.speechBubble = null;
		}

		// Click pulse effect
		this.targetScale = 1.15;
		setTimeout(() => {
			this.targetScale = 1;
		}, 150);

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
		const bw = text.width + padX * 2;
		const bh = text.height + padY * 2;

		// Bubble shadow
		bg.roundRect(1, 1, bw, bh, 6);
		bg.fill({ color: 0x000000, alpha: 0.2 });
		// Bubble body
		bg.roundRect(0, 0, bw, bh, 6);
		bg.fill(0xffffff);
		// Triangle pointer
		const cx = bw / 2;
		bg.moveTo(cx - 4, bh);
		bg.lineTo(cx, bh + 5);
		bg.lineTo(cx + 4, bh);
		bg.closePath();
		bg.fill(0xffffff);

		text.x = padX;
		text.y = padY;
		bubble.addChild(bg);
		bubble.addChild(text);

		// Position above sprite
		bubble.x = DISPLAY_SIZE / 2 - bw / 2;
		bubble.y = -(bh + 12);

		this.container.addChild(bubble);
		this.speechBubble = bubble;
		this.speechTimer = 180;
	}

	/** Whether this worker is available for a conversation */
	get isAvailableForInteraction(): boolean {
		return (
			this.currentStatus === "idle" &&
			this.wanderState === "sitting" &&
			!this.moveTarget
		);
	}

	/** Walk to a specific point for an interaction */
	walkToPoint(target: Position): void {
		this.wanderState = "interaction_walk";
		this.setMoveTarget(target);
	}

	/** Register a one-shot callback for when movement completes */
	onArrive(callback: () => void): void {
		this.arrivalCallback = callback;
	}

	/** Enter conversation state (freeze in place) */
	startConversing(): void {
		this.wanderState = "interaction_converse";
		this.moveTarget = null;
		this.moveStartPos = null;
	}

	/** Show a specific speech bubble text */
	showCustomSpeech(text: string, duration = 150): void {
		if (this.speechBubble) {
			this.container.removeChild(this.speechBubble);
			this.speechBubble.destroy({ children: true });
			this.speechBubble = null;
		}

		const bubble = new Container();
		const label = new Text({
			text,
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
		const bw = label.width + padX * 2;
		const bh = label.height + padY * 2;

		bg.roundRect(1, 1, bw, bh, 6);
		bg.fill({ color: 0x000000, alpha: 0.2 });
		bg.roundRect(0, 0, bw, bh, 6);
		bg.fill(0xffffff);
		const cx = bw / 2;
		bg.moveTo(cx - 4, bh);
		bg.lineTo(cx, bh + 5);
		bg.lineTo(cx + 4, bh);
		bg.closePath();
		bg.fill(0xffffff);

		label.x = padX;
		label.y = padY;
		bubble.addChild(bg);
		bubble.addChild(label);
		bubble.x = DISPLAY_SIZE / 2 - bw / 2;
		bubble.y = -(bh + 12);

		this.container.addChild(bubble);
		this.speechBubble = bubble;
		this.speechTimer = duration;
	}

	/** Walk back to home position after an interaction.
	 *  Caller should use onArrive() before calling this if they need a callback. */
	returnFromInteraction(): void {
		this.wanderState = "interaction_return";
		this.setMoveTarget({ ...this.homePosition });
	}

	/** Reset to normal idle state after interaction completes */
	finishInteraction(): void {
		this.wanderState = "sitting";
		this.idleTimer = 300 + Math.random() * 600;
		// Apply any deferred status change
		if (this.deferredStatus) {
			const s = this.deferredStatus;
			this.deferredStatus = null;
			this.setStatus(s);
		}
	}

	/** Brief cosmetic "working" flash for trigger (no real status change) */
	playBriefWorking(durationMs = 3000): void {
		const prevStatus = this.currentStatus;
		this.currentStatus = "working";
		this.frameIndex = 0;
		this.frameTick = 0;
		this.drawStatusDot();

		setTimeout(() => {
			this.currentStatus = prevStatus;
			this.frameIndex = 0;
			this.frameTick = 0;
			this.drawStatusDot();
		}, durationMs);
	}

	destroy(): void {
		this.ticker.stop();
		this.ticker.destroy();
		this.container.destroy({ children: true });
	}
}
