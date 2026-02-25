import { Graphics, Container } from "pixi.js";
import type { WorkerConfig, InfraConfig, WorkerStatus } from "@/lib/types";

const SPRITE_CENTER = 24; // half of 48px worker sprite
const INFRA_CENTER = 20; // half of 40px infra sprite

interface Connection {
	workerId: string;
	infraId: string;
	line: Graphics;
}

export class ConnectionLines {
	container: Container;
	private connections: Connection[] = [];
	private dashOffset = 0;

	constructor(
		workers: { config: WorkerConfig; x: number; y: number }[],
		infra: { config: InfraConfig; x: number; y: number }[],
	) {
		this.container = new Container();
		this.container.alpha = 0.3;

		const infraMap = new Map(infra.map((i) => [i.config.id, i]));

		for (const worker of workers) {
			for (const infraId of worker.config.connectedInfra) {
				const target = infraMap.get(infraId);
				if (!target) continue;

				const line = new Graphics();
				this.drawDashedLine(
					line,
					worker.x + SPRITE_CENTER,
					worker.y + SPRITE_CENTER,
					target.x + INFRA_CENTER,
					target.y + INFRA_CENTER,
					Number.parseInt(worker.config.color.replace("#", ""), 16),
				);
				this.container.addChild(line);
				this.connections.push({
					workerId: worker.config.id,
					infraId,
					line,
				});
			}
		}
	}

	private drawDashedLine(
		g: Graphics,
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		color: number,
	): void {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const dashLen = 6;
		const gapLen = 4;
		const stepLen = dashLen + gapLen;
		const steps = Math.floor(dist / stepLen);

		g.clear();
		for (let i = 0; i < steps; i++) {
			const t1 = (i * stepLen) / dist;
			const t2 = Math.min((i * stepLen + dashLen) / dist, 1);
			g.moveTo(x1 + dx * t1, y1 + dy * t1);
			g.lineTo(x1 + dx * t2, y1 + dy * t2);
		}
		g.stroke({ width: 1, color });
	}

	setWorkerActive(workerId: string, status: WorkerStatus): void {
		for (const conn of this.connections) {
			if (conn.workerId === workerId) {
				conn.line.alpha = status === "working" ? 3 : 1;
			}
		}
	}

	destroy(): void {
		this.container.destroy({ children: true });
	}
}
