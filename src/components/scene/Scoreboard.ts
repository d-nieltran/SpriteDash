import { Container, Graphics, Text, TextStyle, Ticker } from "pixi.js";

const STORAGE_KEY = "spritedash-scores";

interface Scores {
	chats: number;
	dispatches: number;
	streak: number;
}

export class Scoreboard {
	container: Container;
	private chatsText: Text;
	private dispatchesText: Text;
	private streakText: Text;
	private scores: Scores;
	private ticker: Ticker;
	private bouncing: Map<Text, number> = new Map();

	constructor(x: number, y: number, w = 90, h = 50) {
		this.scores = this.load();
		this.container = new Container();
		this.container.x = x;
		this.container.y = y;

		const g = new Graphics();

		// Frame
		g.roundRect(0, 0, w, h, 2);
		g.fill(0x888888);

		// White surface
		g.rect(3, 3, w - 6, h - 10);
		g.fill(0xeeeeff);

		// Tray
		g.rect(3, h - 6, w - 6, 3);
		g.fill(0x888888);

		this.container.addChild(g);

		// Title
		const title = new Text({
			text: "SCORES",
			style: new TextStyle({
				fontFamily: "Inter, SF Pro Display, sans-serif",
				fontSize: 6,
				fill: 0x555555,
				fontWeight: "700",
				letterSpacing: 1.5,
			}),
		});
		title.x = 7;
		title.y = 6;
		this.container.addChild(title);

		const labelStyle = new TextStyle({
			fontFamily: "Inter, SF Pro Display, sans-serif",
			fontSize: 6,
			fill: 0x777777,
			fontWeight: "400",
		});

		const valueStyle = new TextStyle({
			fontFamily: "JetBrains Mono, SF Mono, monospace",
			fontSize: 7,
			fill: 0x333333,
			fontWeight: "700",
		});

		// Row 1: Chats
		const chatLabel = new Text({ text: "Chats", style: labelStyle });
		chatLabel.x = 7;
		chatLabel.y = 15;
		this.container.addChild(chatLabel);

		this.chatsText = new Text({
			text: String(this.scores.chats),
			style: valueStyle,
		});
		this.chatsText.x = w - 14;
		this.chatsText.y = 15;
		this.chatsText.anchor.set(1, 0);
		this.container.addChild(this.chatsText);

		// Row 2: Runs
		const runsLabel = new Text({ text: "Runs", style: labelStyle });
		runsLabel.x = 7;
		runsLabel.y = 24;
		this.container.addChild(runsLabel);

		this.dispatchesText = new Text({
			text: String(this.scores.dispatches),
			style: valueStyle,
		});
		this.dispatchesText.x = w - 14;
		this.dispatchesText.y = 24;
		this.dispatchesText.anchor.set(1, 0);
		this.container.addChild(this.dispatchesText);

		// Row 3: Streak
		const streakLabel = new Text({ text: "Streak", style: labelStyle });
		streakLabel.x = 7;
		streakLabel.y = 33;
		this.container.addChild(streakLabel);

		this.streakText = new Text({
			text: String(this.scores.streak),
			style: valueStyle,
		});
		this.streakText.x = w - 14;
		this.streakText.y = 33;
		this.streakText.anchor.set(1, 0);
		this.container.addChild(this.streakText);

		// Ticker for bounce animation
		this.ticker = new Ticker();
		this.ticker.add(() => this.updateBounce());
		this.ticker.start();
	}

	increment(stat: "chats" | "dispatches"): void {
		this.scores[stat]++;
		const textNode =
			stat === "chats" ? this.chatsText : this.dispatchesText;
		textNode.text = String(this.scores[stat]);
		this.startBounce(textNode);
		this.save();
	}

	setStreak(n: number): void {
		if (n !== this.scores.streak) {
			this.scores.streak = n;
			this.streakText.text = String(n);
			this.startBounce(this.streakText);
			this.save();
		}
	}

	private startBounce(text: Text): void {
		this.bouncing.set(text, 12); // 12 frames of bounce
	}

	private updateBounce(): void {
		for (const [text, frames] of this.bouncing) {
			if (frames <= 0) {
				text.scale.set(1);
				this.bouncing.delete(text);
			} else {
				const progress = frames / 12;
				const scale = 1 + Math.sin(progress * Math.PI) * 0.35;
				text.scale.set(scale);
				this.bouncing.set(text, frames - 1);
			}
		}
	}

	private load(): Scores {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				return {
					chats: parsed.chats ?? 0,
					dispatches: parsed.dispatches ?? 0,
					streak: parsed.streak ?? 0,
				};
			}
		} catch {
			// ignore
		}
		return { chats: 0, dispatches: 0, streak: 0 };
	}

	private save(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
		} catch {
			// ignore
		}
	}

	destroy(): void {
		this.ticker.stop();
		this.ticker.destroy();
		this.container.destroy({ children: true });
	}
}
