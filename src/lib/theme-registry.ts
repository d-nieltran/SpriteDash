import type { Theme } from "./types";

export const THEMES: Theme[] = [
	{
		id: "office",
		name: "Office / Lab",
		floorColor: "#c8b8a0",
		spriteSheetPrefix: "themes/office",
	},
];

export const DEFAULT_THEME = THEMES[0];

export function getTheme(id: string): Theme {
	return THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}
