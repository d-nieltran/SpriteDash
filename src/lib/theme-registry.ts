import type { Theme } from "./types";

export const THEMES: Theme[] = [
	{
		id: "office",
		name: "Office / Lab",
		floorColors: {
			spoolprices: "#1a1410",
			oncstrata: "#141820",
			nieltran: "#18141e",
		},
		floorTiles: {
			spoolprices: "/sprites/floor/wood-tile.png",
			oncstrata: "/sprites/floor/lab-tile.png",
			nieltran: "/sprites/floor/carpet-tile.png",
		},
		wallBase: "/sprites/floor/wall-base.png",
		spriteSheetPrefix: "themes/office",
	},
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
	return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}
