import { Assets, Texture, Rectangle } from "pixi.js";

const WORKER_COLS = 4;
const WORKER_ROWS = 4; // idle, working, error, celebrate

export interface WorkerFrames {
	idle: Texture[];
	working: Texture[];
	error: Texture[];
	celebrate: Texture[];
}

/** Slice a worker sprite sheet (any size) into 4x4 grid frame textures */
function sliceWorkerSheet(baseTexture: Texture): WorkerFrames {
	// Dynamically compute frame size from actual image dimensions
	const frameW = Math.floor(baseTexture.width / WORKER_COLS);
	const frameH = Math.floor(baseTexture.height / WORKER_ROWS);

	const rows: (keyof WorkerFrames)[] = [
		"idle",
		"working",
		"error",
		"celebrate",
	];
	const frames: WorkerFrames = { idle: [], working: [], error: [], celebrate: [] };

	for (let row = 0; row < WORKER_ROWS; row++) {
		for (let col = 0; col < WORKER_COLS; col++) {
			const frame = new Texture({
				source: baseTexture.source,
				frame: new Rectangle(
					col * frameW,
					row * frameH,
					frameW,
					frameH,
				),
			});
			frame.source.scaleMode = "nearest";
			frames[rows[row]].push(frame);
		}
	}

	return frames;
}

/** Slice a multi-frame furniture sprite into N equal columns */
function sliceFurnitureFrames(
	baseTexture: Texture,
	numFrames: number,
): Texture[] {
	const frameW = Math.floor(baseTexture.width / numFrames);
	const frameH = baseTexture.height;
	const textures: Texture[] = [];

	for (let col = 0; col < numFrames; col++) {
		const frame = new Texture({
			source: baseTexture.source,
			frame: new Rectangle(col * frameW, 0, frameW, frameH),
		});
		frame.source.scaleMode = "nearest";
		textures.push(frame);
	}

	return textures;
}

// Cache loaded assets
const workerCache = new Map<string, WorkerFrames>();
const textureCache = new Map<string, Texture>();
const furnitureFrameCache = new Map<string, Texture[]>();

/** Load a worker sprite sheet and return frame textures, or null if missing */
export async function loadWorkerFrames(
	name: string,
): Promise<WorkerFrames | null> {
	if (workerCache.has(name)) return workerCache.get(name)!;

	try {
		const path = `/sprites/workers/${name}.png`;
		const texture = await Assets.load<Texture>(path);
		texture.source.scaleMode = "nearest";
		const frames = sliceWorkerSheet(texture);
		workerCache.set(name, frames);
		return frames;
	} catch {
		return null;
	}
}

/** Load a single static sprite texture, or null if missing */
export async function loadTexture(path: string): Promise<Texture | null> {
	if (textureCache.has(path)) return textureCache.get(path)!;

	try {
		const texture = await Assets.load<Texture>(path);
		texture.source.scaleMode = "nearest";
		textureCache.set(path, texture);
		return texture;
	} catch {
		return null;
	}
}

/** Load a multi-frame furniture sprite, or null if missing */
export async function loadFurnitureFrames(
	path: string,
	numFrames = 2,
): Promise<Texture[] | null> {
	if (furnitureFrameCache.has(path)) return furnitureFrameCache.get(path)!;

	try {
		const texture = await Assets.load<Texture>(path);
		texture.source.scaleMode = "nearest";
		const frames = sliceFurnitureFrames(texture, numFrames);
		furnitureFrameCache.set(path, frames);
		return frames;
	} catch {
		return null;
	}
}

/** Worker ID to sprite sheet filename mapping */
const WORKER_SPRITE_MAP: Record<string, string> = {
	"spoolprices-worker": "clerk",
	"oncstrata-worker": "scientist",
	"kol-sync-worker": "librarian",
	"oncology-sync-worker": "courier",
	"nccn-monitor-worker": "detective",
};

export function getWorkerSpriteName(workerId: string): string {
	return WORKER_SPRITE_MAP[workerId] ?? workerId;
}

/** Infra type to furniture sprite path mapping */
const FURNITURE_SPRITE_MAP: Record<string, string> = {
	d1: "/sprites/furniture/filing-cabinet.png",
	kv: "/sprites/furniture/mailbox.png",
	r2: "/sprites/furniture/shelf-boxes.png",
	queue: "/sprites/furniture/conveyor-belt.png",
	ai: "/sprites/furniture/ai-terminal.png",
};

/** Special overrides for specific infra IDs */
const FURNITURE_ID_OVERRIDES: Record<string, string> = {
	"queue-dlq": "/sprites/furniture/conveyor-dlq.png",
};

export function getFurnitureSpritePath(
	infraId: string,
	infraType: string,
): string {
	return FURNITURE_ID_OVERRIDES[infraId] ?? FURNITURE_SPRITE_MAP[infraType] ?? "";
}

/** Multi-frame furniture types (have 2 animation frames) */
export function isAnimatedFurniture(infraType: string): boolean {
	return infraType === "queue" || infraType === "ai";
}
