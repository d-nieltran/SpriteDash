import { Ticker } from "pixi.js";
import type { WorkerSprite } from "../sprites/WorkerSprite";
import {
	pickConversation,
	TRIGGER_SCRIPTS,
	type ConversationScript,
} from "@/lib/conversation-data";

const CHECK_MIN = 1200; // ~20s at 60fps
const CHECK_MAX = 2400; // ~40s at 60fps
const LINE_DURATION = 150; // ~2.5s per speech bubble
const LINE_GAP = 30; // ~0.5s gap between lines

type Phase =
	| "idle"
	| "walking"
	| "conversing"
	| "returning"
	| "trigger_walk"
	| "trigger_converse"
	| "trigger_working"
	| "trigger_return";

export class InteractionManager {
	private sprites: Map<string, WorkerSprite>;
	private ticker: Ticker;
	private timer: number;
	private phase: Phase = "idle";

	// Active conversation state
	private spriteA: WorkerSprite | null = null;
	private spriteB: WorkerSprite | null = null;
	private idA = "";
	private idB = "";
	private script: ConversationScript | null = null;
	private lineIndex = 0;
	private lineTimer = 0;
	private arrivedCount = 0;

	// Trigger state
	private triggerTarget: WorkerSprite | null = null;
	private triggerTargetId = "";

	constructor(sprites: Map<string, WorkerSprite>) {
		this.sprites = sprites;
		this.timer = CHECK_MIN + Math.random() * (CHECK_MAX - CHECK_MIN);
		this.ticker = new Ticker();
		this.ticker.add(() => this.update());
		this.ticker.start();
	}

	get isBusy(): boolean {
		return this.phase !== "idle";
	}

	/** Force a random conversation between two available workers */
	forceChat(): void {
		if (this.phase !== "idle") return;
		this.tryStartConversation();
	}

	/** Trigger a manual run: Sonne walks to target, dialogue, target works briefly */
	triggerWorker(targetId: string): void {
		if (this.phase !== "idle") return;

		const sonne = this.sprites.get("sonne-manager");
		const target = this.sprites.get(targetId);
		if (!sonne || !target) return;

		this.phase = "trigger_walk";
		this.spriteA = sonne;
		this.spriteB = target;
		this.idA = "sonne-manager";
		this.idB = targetId;
		this.triggerTarget = target;
		this.triggerTargetId = targetId;
		this.arrivedCount = 0;

		// Sonne walks to target (50px offset to the left)
		const targetPos = {
			x: target.container.x - 50,
			y: target.container.y,
		};
		sonne.walkToPoint(targetPos);
		sonne.onArrive(() => {
			this.arrivedCount++;
			if (this.arrivedCount >= 1) {
				this.startTriggerConversation();
			}
		});
	}

	private startTriggerConversation(): void {
		this.phase = "trigger_converse";
		this.spriteA!.startConversing();

		this.script = TRIGGER_SCRIPTS[this.triggerTargetId] ?? {
			lines: [
				{ speaker: 0, text: "Run it now!" },
				{ speaker: 1, text: "On it!" },
			],
		};
		this.lineIndex = 0;
		this.lineTimer = 0;
		this.showCurrentLine();
	}

	private update(): void {
		switch (this.phase) {
			case "idle":
				this.timer--;
				if (this.timer <= 0) {
					this.tryStartConversation();
					this.timer =
						CHECK_MIN +
						Math.random() * (CHECK_MAX - CHECK_MIN);
				}
				break;

			case "conversing":
			case "trigger_converse":
				this.lineTimer--;
				if (this.lineTimer <= 0) {
					this.lineIndex++;
					if (
						this.script &&
						this.lineIndex < this.script.lines.length
					) {
						this.lineTimer = LINE_GAP;
						// Show next line after gap
						setTimeout(() => this.showCurrentLine(), 0);
					} else {
						// Conversation done
						if (this.phase === "trigger_converse") {
							this.startTriggerWorking();
						} else {
							this.startReturning();
						}
					}
				}
				break;

			case "trigger_working":
				// Waiting for brief working animation (handled by setTimeout)
				break;

			case "trigger_return":
			case "returning":
				// Waiting for sprites to arrive home (handled by onArrive callbacks)
				break;
		}
	}

	private tryStartConversation(): void {
		// Get all available workers
		const available: string[] = [];
		for (const [id, sprite] of this.sprites) {
			if (sprite.isAvailableForInteraction) {
				available.push(id);
			}
		}

		if (available.length < 2) return;

		// Pick 2 random workers
		const shuffled = available.sort(() => Math.random() - 0.5);
		this.idA = shuffled[0];
		this.idB = shuffled[1];
		this.spriteA = this.sprites.get(this.idA)!;
		this.spriteB = this.sprites.get(this.idB)!;

		// Calculate meeting point (midpoint between homes, clamped to office)
		const midX = (this.spriteA.container.x + this.spriteB.container.x) / 2;
		const midY = Math.min(
			Math.max(
				(this.spriteA.container.y + this.spriteB.container.y) / 2,
				70,
			),
			410,
		);

		this.phase = "walking";
		this.arrivedCount = 0;

		// Walk both to meeting point, offset 20px apart
		this.spriteA.walkToPoint({ x: midX - 20, y: midY });
		this.spriteB.walkToPoint({ x: midX + 20, y: midY });

		this.spriteA.onArrive(() => {
			this.arrivedCount++;
			if (this.arrivedCount >= 2) this.startConversation();
		});
		this.spriteB.onArrive(() => {
			this.arrivedCount++;
			if (this.arrivedCount >= 2) this.startConversation();
		});
	}

	private startConversation(): void {
		this.phase = "conversing";
		this.spriteA!.startConversing();
		this.spriteB!.startConversing();

		this.script = pickConversation(this.idA, this.idB);
		this.lineIndex = 0;
		this.lineTimer = 0;
		this.showCurrentLine();
	}

	private showCurrentLine(): void {
		if (!this.script || this.lineIndex >= this.script.lines.length) return;
		const line = this.script.lines[this.lineIndex];
		const speaker = line.speaker === 0 ? this.spriteA : this.spriteB;
		speaker?.showCustomSpeech(line.text, LINE_DURATION);
		this.lineTimer = LINE_DURATION + LINE_GAP;
	}

	private startReturning(): void {
		this.phase = "returning";
		let returned = 0;
		const checkDone = () => {
			returned++;
			if (returned >= 2) {
				this.phase = "idle";
				this.spriteA = null;
				this.spriteB = null;
				this.script = null;
			}
		};

		this.spriteA!.onArrive(() => {
			this.spriteA!.finishInteraction();
			checkDone();
		});
		this.spriteA!.returnFromInteraction();

		this.spriteB!.onArrive(() => {
			this.spriteB!.finishInteraction();
			checkDone();
		});
		this.spriteB!.returnFromInteraction();
	}

	private startTriggerWorking(): void {
		this.phase = "trigger_working";
		// Target plays brief working animation
		this.triggerTarget?.playBriefWorking(3000);

		setTimeout(() => {
			this.startTriggerReturn();
		}, 3000);
	}

	private startTriggerReturn(): void {
		this.phase = "trigger_return";

		// Sonne returns home
		this.spriteA!.onArrive(() => {
			this.spriteA!.finishInteraction();
			this.phase = "idle";
			this.spriteA = null;
			this.spriteB = null;
			this.triggerTarget = null;
			this.script = null;
		});
		this.spriteA!.returnFromInteraction();

		// Target also returns
		if (this.spriteB) {
			this.spriteB.onArrive(() => {
				this.spriteB?.finishInteraction();
			});
			this.spriteB.returnFromInteraction();
		}
	}

	destroy(): void {
		this.ticker.stop();
		this.ticker.destroy();
	}
}
