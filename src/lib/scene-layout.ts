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
