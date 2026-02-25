export interface Zone {
	id: string;
	label: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const ZONES: Zone[] = [
	{
		id: "spoolprices",
		label: "SpoolPrices",
		x: 0,
		y: 0,
		width: 427,
		height: 720,
	},
	{
		id: "oncstrata",
		label: "OncStrata",
		x: 427,
		y: 0,
		width: 426,
		height: 720,
	},
	{
		id: "nieltran",
		label: "nieltran.com",
		x: 853,
		y: 0,
		width: 427,
		height: 720,
	},
];

export const SCENE_WIDTH = 1280;
export const SCENE_HEIGHT = 720;
export const HUD_HEIGHT = 60;

export interface Decoration {
	id: string;
	sprite: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export const DECORATIONS: Decoration[] = [
	// SpoolPrices zone — warm shop floor
	{ id: "sp-desk1", sprite: "/sprites/decor/desk-computer.png", x: 20, y: 170, width: 56, height: 48 },
	{ id: "sp-chair1", sprite: "/sprites/decor/office-chair.png", x: 78, y: 200, width: 28, height: 28 },
	{ id: "sp-desk2", sprite: "/sprites/decor/desk-computer.png", x: 190, y: 170, width: 56, height: 48 },
	{ id: "sp-chair2", sprite: "/sprites/decor/office-chair.png", x: 248, y: 200, width: 28, height: 28 },
	{ id: "sp-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 350, y: 100, width: 24, height: 40 },
	{ id: "sp-shelf", sprite: "/sprites/decor/bookshelf.png", x: 370, y: 140, width: 44, height: 64 },
	{ id: "sp-chart1", sprite: "/sprites/decor/wall-chart.png", x: 140, y: 60, width: 36, height: 36 },
	{ id: "sp-water", sprite: "/sprites/decor/water-cooler.png", x: 310, y: 340, width: 24, height: 44 },
	{ id: "sp-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 16, y: 480, width: 24, height: 40 },

	// OncStrata zone — science lab
	{ id: "on-desk1", sprite: "/sprites/decor/desk-computer.png", x: 440, y: 170, width: 56, height: 48 },
	{ id: "on-chair1", sprite: "/sprites/decor/office-chair.png", x: 498, y: 200, width: 28, height: 28 },
	{ id: "on-desk2", sprite: "/sprites/decor/desk-computer.png", x: 690, y: 170, width: 56, height: 48 },
	{ id: "on-chair2", sprite: "/sprites/decor/office-chair.png", x: 748, y: 200, width: 28, height: 28 },
	{ id: "on-flask", sprite: "/sprites/decor/lab-flask.png", x: 540, y: 300, width: 24, height: 36 },
	{ id: "on-micro", sprite: "/sprites/decor/microscope.png", x: 575, y: 295, width: 32, height: 32 },
	{ id: "on-server", sprite: "/sprites/decor/server-rack.png", x: 790, y: 300, width: 44, height: 64 },
	{ id: "on-chart1", sprite: "/sprites/decor/wall-chart.png", x: 570, y: 60, width: 36, height: 36 },
	{ id: "on-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 435, y: 420, width: 24, height: 40 },
	{ id: "on-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 810, y: 420, width: 24, height: 40 },
	{ id: "on-white", sprite: "/sprites/decor/whiteboard.png", x: 640, y: 55, width: 72, height: 48 },

	// nieltran zone — cozy office
	{ id: "nt-desk1", sprite: "/sprites/decor/desk-computer.png", x: 865, y: 170, width: 56, height: 48 },
	{ id: "nt-chair1", sprite: "/sprites/decor/office-chair.png", x: 923, y: 200, width: 28, height: 28 },
	{ id: "nt-desk2", sprite: "/sprites/decor/desk-computer.png", x: 1035, y: 170, width: 56, height: 48 },
	{ id: "nt-chair2", sprite: "/sprites/decor/office-chair.png", x: 1093, y: 200, width: 28, height: 28 },
	{ id: "nt-shelf1", sprite: "/sprites/decor/bookshelf.png", x: 1195, y: 90, width: 44, height: 64 },
	{ id: "nt-shelf2", sprite: "/sprites/decor/bookshelf.png", x: 1235, y: 90, width: 44, height: 64 },
	{ id: "nt-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 860, y: 380, width: 24, height: 40 },
	{ id: "nt-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 1250, y: 380, width: 24, height: 40 },
	{ id: "nt-chart1", sprite: "/sprites/decor/wall-chart.png", x: 975, y: 60, width: 36, height: 36 },
	{ id: "nt-white", sprite: "/sprites/decor/whiteboard.png", x: 1090, y: 55, width: 72, height: 48 },
	{ id: "nt-water", sprite: "/sprites/decor/water-cooler.png", x: 1185, y: 380, width: 24, height: 44 },
];
