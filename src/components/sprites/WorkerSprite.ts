import {
	Container,
	Graphics,
	Text,
	TextStyle,
	Ticker,
} from "pixi.js";
import type { WorkerConfig, WorkerStatus, Position } from "@/lib/types";

const SPRITE_SIZE = 48;
const LABEL_OFFSET_Y = -12;
const MOVE_SPEED = 2; // pixels per frame

export class WorkerSprite {
	container: Container;
	config: WorkerConfig;
	private body: Graphics;
	private nameLabel: Text;
	private statusDot: Graphics;
	private currentStatus: WorkerStatus = "idle";
	private homePosition: Position;
	private moveTarget: Position | null = null;
	private animationPhase = 0;
	private ticker: Ticker;

	constructor(config: WorkerConfig) {
		this.config = config;
		this.homePosition = { ...config.position };
		this.container = new Container();
		this.container.x = config.position.x;
		this.container.y = config.position.y;
		this.container.eventMode = "static";
		this.container.cursor = "pointer";

		// Placeholder body (colored square with character initial)
		this.body = new Graphics();
		this.drawBody();

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
		this.nameLabel.x = SPRITE_SIZE / 2;
		this.nameLabel.y = LABEL_OFFSET_Y;
		this.nameLabel.alpha = 0;

		// Status dot
		this.statusDot = new Graphics();
		this.drawStatusDot();
		this.statusDot.x = SPRITE_SIZE - 4;
		this.statusDot.y = 4;

		this.container.addChild(this.body);
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
	}

	private drawBody(): void {
		this.body.clear();
		const color = Number.parseInt(this.config.color.replace("#", ""), 16);

		// Body rectangle
		this.body.roundRect(0, 0, SPRITE_SIZE, SPRITE_SIZE, 6);
		this.body.fill(color);

		// Eyes (2 white dots)
		this.body.circle(SPRITE_SIZE * 0.35, SPRITE_SIZE * 0.35, 4);
		this.body.circle(SPRITE_SIZE * 0.65, SPRITE_SIZE * 0.35, 4);
		this.body.fill(0xffffff);

		// Pupils
		this.body.circle(SPRITE_SIZE * 0.37, SPRITE_SIZE * 0.35, 2);
		this.body.circle(SPRITE_SIZE * 0.67, SPRITE_SIZE * 0.35, 2);
		this.body.fill(0x1a1c2c);

		// Mouth (small arc)
		this.body.moveTo(SPRITE_SIZE * 0.35, SPRITE_SIZE * 0.6);
		this.body.quadraticCurveTo(
			SPRITE_SIZE * 0.5,
			SPRITE_SIZE * 0.75,
			SPRITE_SIZE * 0.65,
			SPRITE_SIZE * 0.6,
		);
		this.body.stroke({ width: 2, color: 0x1a1c2c });
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

	private animate(): void {
		this.animationPhase += 0.05;

		if (this.currentStatus === "working") {
			// Bobbing animation
			this.body.y = Math.sin(this.animationPhase * 3) * 3;
		} else if (this.currentStatus === "error") {
			// Shake animation
			this.body.x = Math.sin(this.animationPhase * 10) * 2;
		} else if (this.currentStatus === "celebrate") {
			// Jump animation
			this.body.y = -Math.abs(Math.sin(this.animationPhase * 4)) * 8;
		} else {
			// Idle: gentle breathing
			this.body.y = Math.sin(this.animationPhase) * 1;
			this.body.x = 0;
		}

		// Movement towards target
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
		this.drawStatusDot();

		// Play celebrate briefly on working → idle transition
		if (prev === "working" && status === "idle") {
			this.currentStatus = "celebrate";
			this.drawStatusDot();
			setTimeout(() => {
				this.currentStatus = "idle";
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
