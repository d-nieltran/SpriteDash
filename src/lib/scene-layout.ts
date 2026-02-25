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

// Decoration sprites — wall-mounted + plants only (no desk/chair PNGs)
export interface Decoration {
	id: string;
	sprite: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const DECORATIONS: Decoration[] = [
	// Back wall (y=0-60) — mounted against opaque wall
	{ id: "wall-shelf1", sprite: "/sprites/decor/bookshelf.png", x: 30, y: 0, width: 44, height: 60 },
	{ id: "wall-chart1", sprite: "/sprites/decor/wall-chart.png", x: 120, y: 14, width: 36, height: 36 },
	{ id: "wall-white1", sprite: "/sprites/decor/whiteboard.png", x: 300, y: 6, width: 72, height: 48 },
	{ id: "wall-chart2", sprite: "/sprites/decor/wall-chart.png", x: 460, y: 14, width: 36, height: 36 },
	{ id: "wall-shelf2", sprite: "/sprites/decor/bookshelf.png", x: 600, y: 0, width: 44, height: 60 },
	{ id: "wall-white2", sprite: "/sprites/decor/whiteboard.png", x: 740, y: 6, width: 72, height: 48 },
	{ id: "wall-chart3", sprite: "/sprites/decor/wall-chart.png", x: 900, y: 14, width: 36, height: 36 },
	{ id: "wall-shelf3", sprite: "/sprites/decor/bookshelf.png", x: 1040, y: 0, width: 44, height: 60 },
	{ id: "wall-chart4", sprite: "/sprites/decor/wall-chart.png", x: 1180, y: 14, width: 36, height: 36 },

	// Corner plants
	{ id: "plant-nw", sprite: "/sprites/decor/potted-plant-1.png", x: 20, y: 70, width: 24, height: 40 },
	{ id: "plant-ne", sprite: "/sprites/decor/potted-plant-2.png", x: 1236, y: 70, width: 24, height: 40 },
	{ id: "plant-sw", sprite: "/sprites/decor/potted-plant-1.png", x: 20, y: 386, width: 24, height: 40 },
	{ id: "plant-se", sprite: "/sprites/decor/potted-plant-2.png", x: 1236, y: 386, width: 24, height: 40 },

	// Communal
	{ id: "water1", sprite: "/sprites/decor/water-cooler.png", x: 1100, y: 240, width: 24, height: 44 },
];
