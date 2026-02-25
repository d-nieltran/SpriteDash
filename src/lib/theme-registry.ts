import type { Theme } from "./types";

export const THEMES: Theme[] = [
	{
		id: "office",
		name: "Office / Lab",
		floorColors: {
			spoolprices: "#3d2b1f",
			oncstrata: "#e8e8f0",
			nieltran: "#4a3a5c",
		},
		spriteSheetPrefix: "themes/office",
	},
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
	return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}
