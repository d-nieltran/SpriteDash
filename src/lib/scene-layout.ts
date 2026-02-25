export const SCENE_WIDTH = 1280;
export const SCENE_HEIGHT = 720;
export const HUD_HEIGHT = 60;

// Room zone boundaries
export const WALL_Y = 0;
export const WALL_HEIGHT = 60;
export const OFFICE_Y = 60;
export const OFFICE_HEIGHT = 370;
export const DIVIDER_Y = 430;
export const DIVIDER_HEIGHT = 30;
export const SERVER_Y = 460;
export const SERVER_HEIGHT = 260;

export const ROOM = {
	label: "SPRITEDASH HQ",
	x: 0,
	y: 0,
	width: SCENE_WIDTH,
	height: SCENE_HEIGHT,
};

// Workstation definitions — Graphics-drawn desks with worker positions
export interface Workstation {
	workerId: string;
	desk: { x: number; y: number; w: number; h: number };
	monitor: { x: number; y: number };
	chair: { cx: number; cy: number };
	screenColor: number;
}

export const WORKSTATIONS: Workstation[] = [
	// Row 1: 3 desks at y=140
	{
		workerId: "spoolprices-worker",
		desk: { x: 140, y: 140, w: 120, h: 40 },
		monitor: { x: 188, y: 130 },
		chair: { cx: 200, cy: 210 },
		screenColor: 0xef7d57,
	},
	{
		workerId: "oncstrata-worker",
		desk: { x: 480, y: 140, w: 120, h: 40 },
		monitor: { x: 528, y: 130 },
		chair: { cx: 540, cy: 210 },
		screenColor: 0x0d9488,
	},
	{
		workerId: "kol-sync-worker",
		desk: { x: 820, y: 140, w: 120, h: 40 },
		monitor: { x: 868, y: 130 },
		chair: { cx: 880, cy: 210 },
		screenColor: 0x3f8efc,
	},
	// Row 2: 2 desks at y=290
	{
		workerId: "oncology-sync-worker",
		desk: { x: 310, y: 290, w: 120, h: 40 },
		monitor: { x: 358, y: 280 },
		chair: { cx: 370, cy: 360 },
		screenColor: 0xa78bfa,
	},
	{
		workerId: "nccn-monitor-worker",
		desk: { x: 650, y: 290, w: 120, h: 40 },
		monitor: { x: 698, y: 280 },
		chair: { cx: 710, cy: 360 },
		screenColor: 0xf59e0b,
	},
];

// Room decorations are now drawn with pixel-art Graphics in SceneManager.drawRoomDecor()
// (no PNG sprite loading needed — eliminates transparency/checkerboard artifacts)
