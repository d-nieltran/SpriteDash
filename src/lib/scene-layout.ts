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
		y: 60,
		width: 420,
		height: 660,
	},
	{
		id: "oncstrata",
		label: "OncStrata",
		x: 420,
		y: 60,
		width: 420,
		height: 660,
	},
	{
		id: "nieltran",
		label: "nieltran.com",
		x: 840,
		y: 60,
		width: 440,
		height: 660,
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
	{ id: "sp-desk1", sprite: "/sprites/decor/desk-computer.png", x: 30, y: 160, width: 32, height: 32 },
	{ id: "sp-chair1", sprite: "/sprites/decor/office-chair.png", x: 68, y: 170, width: 24, height: 24 },
	{ id: "sp-desk2", sprite: "/sprites/decor/desk-computer.png", x: 200, y: 160, width: 32, height: 32 },
	{ id: "sp-chair2", sprite: "/sprites/decor/office-chair.png", x: 238, y: 170, width: 24, height: 24 },
	{ id: "sp-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 350, y: 100, width: 16, height: 32 },
	{ id: "sp-shelf", sprite: "/sprites/decor/bookshelf.png", x: 370, y: 160, width: 32, height: 48 },
	{ id: "sp-chart1", sprite: "/sprites/decor/wall-chart.png", x: 160, y: 80, width: 24, height: 24 },
	{ id: "sp-mug1", sprite: "/sprites/decor/coffee-mug.png", x: 42, y: 158, width: 16, height: 16 },
	{ id: "sp-water", sprite: "/sprites/decor/water-cooler.png", x: 310, y: 360, width: 16, height: 32 },
	{ id: "sp-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 16, y: 550, width: 16, height: 32 },

	// OncStrata zone — science lab
	{ id: "on-desk1", sprite: "/sprites/decor/desk-computer.png", x: 450, y: 160, width: 32, height: 32 },
	{ id: "on-chair1", sprite: "/sprites/decor/office-chair.png", x: 488, y: 170, width: 24, height: 24 },
	{ id: "on-desk2", sprite: "/sprites/decor/desk-computer.png", x: 700, y: 160, width: 32, height: 32 },
	{ id: "on-chair2", sprite: "/sprites/decor/office-chair.png", x: 738, y: 170, width: 24, height: 24 },
	{ id: "on-flask", sprite: "/sprites/decor/lab-flask.png", x: 530, y: 200, width: 16, height: 24 },
	{ id: "on-micro", sprite: "/sprites/decor/microscope.png", x: 560, y: 195, width: 24, height: 24 },
	{ id: "on-server", sprite: "/sprites/decor/server-rack.png", x: 790, y: 280, width: 32, height: 48 },
	{ id: "on-chart1", sprite: "/sprites/decor/wall-chart.png", x: 580, y: 80, width: 24, height: 24 },
	{ id: "on-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 435, y: 400, width: 16, height: 32 },
	{ id: "on-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 800, y: 400, width: 16, height: 32 },
	{ id: "on-white", sprite: "/sprites/decor/whiteboard.png", x: 650, y: 80, width: 48, height: 32 },

	// nieltran zone — cozy office
	{ id: "nt-desk1", sprite: "/sprites/decor/desk-computer.png", x: 870, y: 160, width: 32, height: 32 },
	{ id: "nt-chair1", sprite: "/sprites/decor/office-chair.png", x: 908, y: 170, width: 24, height: 24 },
	{ id: "nt-desk2", sprite: "/sprites/decor/desk-computer.png", x: 1040, y: 160, width: 32, height: 32 },
	{ id: "nt-chair2", sprite: "/sprites/decor/office-chair.png", x: 1078, y: 170, width: 24, height: 24 },
	{ id: "nt-shelf1", sprite: "/sprites/decor/bookshelf.png", x: 1200, y: 100, width: 32, height: 48 },
	{ id: "nt-shelf2", sprite: "/sprites/decor/bookshelf.png", x: 1240, y: 100, width: 32, height: 48 },
	{ id: "nt-plant1", sprite: "/sprites/decor/potted-plant-1.png", x: 860, y: 360, width: 16, height: 32 },
	{ id: "nt-plant2", sprite: "/sprites/decor/potted-plant-2.png", x: 1250, y: 360, width: 16, height: 32 },
	{ id: "nt-chart1", sprite: "/sprites/decor/wall-chart.png", x: 980, y: 80, width: 24, height: 24 },
	{ id: "nt-white", sprite: "/sprites/decor/whiteboard.png", x: 1100, y: 80, width: 48, height: 32 },
	{ id: "nt-water", sprite: "/sprites/decor/water-cooler.png", x: 1190, y: 360, width: 16, height: 32 },
	{ id: "nt-mug1", sprite: "/sprites/decor/coffee-mug.png", x: 1052, y: 158, width: 16, height: 16 },
];
