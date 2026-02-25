export const ROOM = {
	label: "SpriteDash HQ",
	x: 0,
	y: 0,
	width: 1280,
	height: 720,
};

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
	// === NORTH WALL (y=0-80): shelves, charts, whiteboards ===
	{ id: "wall-shelf1", sprite: "/sprites/decor/bookshelf.png", x: 20, y: 20, width: 44, height: 64 },
	{ id: "wall-chart1", sprite: "/sprites/decor/wall-chart.png", x: 160, y: 30, width: 36, height: 36 },
	{ id: "wall-white1", sprite: "/sprites/decor/whiteboard.png", x: 380, y: 20, width: 72, height: 48 },
	{ id: "wall-chart2", sprite: "/sprites/decor/wall-chart.png", x: 620, y: 30, width: 36, height: 36 },
	{ id: "wall-white2", sprite: "/sprites/decor/whiteboard.png", x: 820, y: 20, width: 72, height: 48 },
	{ id: "wall-shelf2", sprite: "/sprites/decor/bookshelf.png", x: 1050, y: 20, width: 44, height: 64 },
	{ id: "wall-shelf3", sprite: "/sprites/decor/bookshelf.png", x: 1210, y: 20, width: 44, height: 64 },

	// === DESK+CHAIR COMBOS (near each worker's home position) ===
	// Clerk desk area (~150, 150)
	{ id: "desk1", sprite: "/sprites/decor/desk-computer.png", x: 120, y: 120, width: 56, height: 48 },
	{ id: "chair1", sprite: "/sprites/decor/office-chair.png", x: 178, y: 150, width: 28, height: 28 },
	// Scientist desk area (~400, 250)
	{ id: "desk2", sprite: "/sprites/decor/desk-computer.png", x: 370, y: 220, width: 56, height: 48 },
	{ id: "chair2", sprite: "/sprites/decor/office-chair.png", x: 428, y: 250, width: 28, height: 28 },
	// Librarian desk area (~660, 140)
	{ id: "desk3", sprite: "/sprites/decor/desk-computer.png", x: 630, y: 110, width: 56, height: 48 },
	{ id: "chair3", sprite: "/sprites/decor/office-chair.png", x: 688, y: 140, width: 28, height: 28 },
	// Courier desk area (~920, 270)
	{ id: "desk4", sprite: "/sprites/decor/desk-computer.png", x: 890, y: 240, width: 56, height: 48 },
	{ id: "chair4", sprite: "/sprites/decor/office-chair.png", x: 948, y: 270, width: 28, height: 28 },
	// Detective desk area (~1140, 190)
	{ id: "desk5", sprite: "/sprites/decor/desk-computer.png", x: 1110, y: 160, width: 56, height: 48 },
	{ id: "chair5", sprite: "/sprites/decor/office-chair.png", x: 1168, y: 190, width: 28, height: 28 },

	// === COMMUNAL ===
	{ id: "water1", sprite: "/sprites/decor/water-cooler.png", x: 560, y: 420, width: 24, height: 44 },
	{ id: "lab-flask", sprite: "/sprites/decor/lab-flask.png", x: 500, y: 350, width: 24, height: 36 },
	{ id: "microscope", sprite: "/sprites/decor/microscope.png", x: 535, y: 345, width: 32, height: 32 },

	// === CORNER PLANTS ===
	{ id: "plant-nw", sprite: "/sprites/decor/potted-plant-1.png", x: 80, y: 90, width: 24, height: 40 },
	{ id: "plant-ne", sprite: "/sprites/decor/potted-plant-2.png", x: 1245, y: 90, width: 24, height: 40 },
	{ id: "plant-sw", sprite: "/sprites/decor/potted-plant-1.png", x: 16, y: 480, width: 24, height: 40 },
	{ id: "plant-se", sprite: "/sprites/decor/potted-plant-2.png", x: 1248, y: 480, width: 24, height: 40 },

	// === SERVER AREA ===
	{ id: "server1", sprite: "/sprites/decor/server-rack.png", x: 1200, y: 540, width: 44, height: 64 },
];
