import { Graphics } from "pixi.js";

/**
 * Warm pixel-art color palette inspired by pixel-agents office tileset.
 * Used for all room architecture and Graphics-drawn decorations.
 */
export const PAL = {
	// Wood tones
	woodLight: 0xb8922e,
	woodMed: 0xa07828,
	woodDark: 0x8b6914,
	woodEdge: 0x6b4e0a,

	// Wall
	wallMain: 0x8b8070,
	wallLight: 0xa89880,
	wallDark: 0x706558,

	// Floor
	floorA: 0xc8b8a0,
	floorB: 0xbcad96,
	floorLine: 0xb0a088,

	// Server room (keep dark)
	serverFloor: 0x1e1c28,
	serverLine: 0x2a2838,

	// Divider
	divider: 0x605848,
	dividerLine: 0x504838,

	// Books
	bookRed: 0xcc4444,
	bookBlue: 0x4477aa,
	bookGreen: 0x44aa66,
	bookYellow: 0xccaa33,
	bookPurple: 0x9955aa,

	// Plants
	leafMain: 0x3d8b37,
	leafDark: 0x2d6b27,
	leafLight: 0x5aab47,
	potBody: 0xb85c3a,
	potRim: 0x8b4422,

	// Water cooler
	coolerWhite: 0xccddee,
	coolerBlue: 0x88bbdd,
	coolerGray: 0x999999,

	// Clock
	clockFace: 0xeeeedd,
	clockBorder: 0x6b4e0a,
	clockHand: 0x333333,

	// Window
	winFrame: 0x7b7060,
	winGlass: 0xaad4ee,
	winShine: 0xcce8ff,
	winSill: 0x908070,

	// Whiteboard
	wbFrame: 0x888888,
	wbSurface: 0xeeeeff,
	wbRed: 0xcc4444,
	wbBlue: 0x4477aa,

	// Desk
	deskTop: 0xa07828,
	deskFront: 0x8b6914,
	deskEdge: 0x6b4e0a,

	// Monitor
	screenFrame: 0x2a2d38,

	// Chair
	chairSeat: 0x605040,
	chairBack: 0x504030,
	chairLeg: 0x3a3028,

	// Side wall
	sideWall: 0x7b7060,

	// Server rack
	rackFrame: 0x2a2a3a,
	rackPanel: 0x333344,
	rackSlot: 0x3a3a4a,

	// Infra background
	infraBg: 0x28263a,
	infraBorder: 0x3a3850,
};

/** Draw a bookshelf against the back wall */
export function drawBookshelf(
	g: Graphics,
	x: number,
	y: number,
	w = 50,
	h = 60,
): void {
	// Outer frame
	g.roundRect(x, y, w, h, 2);
	g.fill(PAL.woodDark);

	const inset = 4;
	const shelfCount = 3;
	const shelfH = (h - inset * 2) / shelfCount;
	const bookColors = [
		PAL.bookRed,
		PAL.bookBlue,
		PAL.bookGreen,
		PAL.bookYellow,
		PAL.bookPurple,
	];

	for (let i = 0; i < shelfCount; i++) {
		const sy = y + inset + i * shelfH;

		// Shelf back panel
		g.rect(x + inset, sy, w - inset * 2, shelfH - 3);
		g.fill(PAL.woodEdge);

		// Books (colored spines)
		const innerW = w - inset * 2 - 4;
		const bookCount = 5 + (i % 2);
		const bookW = Math.floor(innerW / bookCount);
		for (let b = 0; b < bookCount; b++) {
			const bx = x + inset + 2 + b * bookW;
			const bh = shelfH - 7 - ((b + i) % 3) * 3;
			g.rect(bx, sy + (shelfH - 3 - bh), bookW - 1, bh);
			g.fill(bookColors[(b + i * 2) % bookColors.length]);
		}

		// Shelf plank
		g.rect(x + inset - 1, sy + shelfH - 4, w - inset * 2 + 2, 4);
		g.fill(PAL.woodMed);
	}
}

/** Draw a potted plant */
export function drawPlant(
	g: Graphics,
	x: number,
	y: number,
	scale = 1,
): void {
	const s = scale;

	// Leaves (overlapping ovals)
	g.ellipse(x + 10 * s, y + 6 * s, 11 * s, 8 * s);
	g.fill(PAL.leafMain);

	g.ellipse(x + 6 * s, y + 4 * s, 6 * s, 5 * s);
	g.fill(PAL.leafDark);

	g.ellipse(x + 15 * s, y + 8 * s, 5 * s, 4 * s);
	g.fill(PAL.leafDark);

	g.ellipse(x + 4 * s, y + 2 * s, 4 * s, 3 * s);
	g.fill(PAL.leafLight);

	g.ellipse(x + 17 * s, y + 4 * s, 3 * s, 3 * s);
	g.fill(PAL.leafLight);

	// Stem
	g.rect(x + 9 * s, y + 12 * s, 2 * s, 8 * s);
	g.fill(PAL.leafDark);

	// Pot rim
	g.roundRect(x + 3 * s, y + 19 * s, 14 * s, 4 * s, 1);
	g.fill(PAL.potRim);

	// Pot body
	g.roundRect(x + 4 * s, y + 23 * s, 12 * s, 12 * s, 2);
	g.fill(PAL.potBody);
}

/** Draw a wall clock */
export function drawClock(
	g: Graphics,
	cx: number,
	cy: number,
	r = 12,
): void {
	// Frame circle
	g.circle(cx, cy, r + 2);
	g.fill(PAL.clockBorder);

	// Face
	g.circle(cx, cy, r);
	g.fill(PAL.clockFace);

	// Hour ticks
	for (let i = 0; i < 12; i++) {
		const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
		const inner = r - 3;
		const outer = r - 1;
		g.moveTo(
			cx + Math.cos(angle) * inner,
			cy + Math.sin(angle) * inner,
		);
		g.lineTo(
			cx + Math.cos(angle) * outer,
			cy + Math.sin(angle) * outer,
		);
	}
	g.stroke({ width: 1, color: PAL.clockHand });

	// Hour hand (~10 o'clock)
	const ha = -Math.PI / 2 + (10 * Math.PI * 2) / 12;
	g.moveTo(cx, cy);
	g.lineTo(cx + Math.cos(ha) * r * 0.5, cy + Math.sin(ha) * r * 0.5);
	g.stroke({ width: 2, color: PAL.clockHand });

	// Minute hand (~2 o'clock)
	const ma = -Math.PI / 2 + (2 * Math.PI * 2) / 12;
	g.moveTo(cx, cy);
	g.lineTo(cx + Math.cos(ma) * r * 0.7, cy + Math.sin(ma) * r * 0.7);
	g.stroke({ width: 1.5, color: PAL.clockHand });

	// Center dot
	g.circle(cx, cy, 2);
	g.fill(PAL.clockHand);
}

/** Draw a water cooler */
export function drawWaterCooler(
	g: Graphics,
	x: number,
	y: number,
): void {
	// Water bottle (top)
	g.roundRect(x + 4, y, 12, 14, 3);
	g.fill(PAL.coolerBlue);

	// Reflection on bottle
	g.roundRect(x + 6, y + 2, 4, 8, 2);
	g.fill({ color: 0xffffff, alpha: 0.25 });

	// Body
	g.roundRect(x + 2, y + 14, 16, 18, 2);
	g.fill(PAL.coolerWhite);

	// Tap area
	g.rect(x + 6, y + 18, 8, 4);
	g.fill(PAL.coolerGray);

	// Drip tray
	g.rect(x + 4, y + 30, 12, 3);
	g.fill(PAL.coolerGray);

	// Base/legs
	g.rect(x + 3, y + 33, 4, 5);
	g.fill(0x666666);
	g.rect(x + 13, y + 33, 4, 5);
	g.fill(0x666666);
}

/** Draw a window on the back wall */
export function drawWindow(
	g: Graphics,
	x: number,
	y: number,
	w = 70,
	h = 44,
): void {
	// Outer frame
	g.roundRect(x, y, w, h, 2);
	g.fill(PAL.winFrame);

	const inset = 3;
	const gap = 3;
	const paneW = (w - inset * 2 - gap) / 2;
	const paneH = h - inset * 2;

	// Left pane
	g.rect(x + inset, y + inset, paneW, paneH);
	g.fill(PAL.winGlass);

	// Left pane reflection
	g.rect(x + inset + 3, y + inset + 3, paneW * 0.3, paneH * 0.4);
	g.fill({ color: PAL.winShine, alpha: 0.5 });

	// Right pane
	const rx = x + inset + paneW + gap;
	g.rect(rx, y + inset, paneW, paneH);
	g.fill(PAL.winGlass);

	// Right pane reflection
	g.rect(rx + 3, y + inset + 3, paneW * 0.3, paneH * 0.4);
	g.fill({ color: PAL.winShine, alpha: 0.5 });

	// Window sill
	g.rect(x - 2, y + h, w + 4, 4);
	g.fill(PAL.winSill);
}

/** Draw a whiteboard */
export function drawWhiteboard(
	g: Graphics,
	x: number,
	y: number,
	w = 90,
	h = 48,
): void {
	// Frame
	g.roundRect(x, y, w, h, 2);
	g.fill(PAL.wbFrame);

	// White surface
	g.rect(x + 3, y + 3, w - 6, h - 10);
	g.fill(PAL.wbSurface);

	// Marker scribbles
	g.moveTo(x + 10, y + 14);
	g.lineTo(x + w * 0.5, y + 14);
	g.stroke({ width: 2, color: PAL.wbRed });

	g.moveTo(x + 10, y + 22);
	g.lineTo(x + w * 0.65, y + 22);
	g.stroke({ width: 2, color: PAL.wbBlue });

	g.moveTo(x + 10, y + 30);
	g.lineTo(x + w * 0.35, y + 30);
	g.stroke({ width: 2, color: PAL.wbBlue });

	// Tray
	g.rect(x + 3, y + h - 6, w - 6, 3);
	g.fill(PAL.wbFrame);

	// Marker on tray
	g.rect(x + w * 0.3, y + h - 8, 14, 3);
	g.fill(PAL.wbRed);
}

/** Draw a decorative server rack for the server room */
export function drawServerRack(
	g: Graphics,
	x: number,
	y: number,
	w = 32,
	h = 50,
): void {
	// Outer frame
	g.roundRect(x, y, w, h, 3);
	g.fill(PAL.rackFrame);

	// Panel
	g.rect(x + 2, y + 2, w - 4, h - 4);
	g.fill(PAL.rackPanel);

	// Server units
	for (let i = 0; i < 5; i++) {
		const sy = y + 5 + i * 9;
		g.rect(x + 4, sy, w - 8, 7);
		g.fill(PAL.rackSlot);

		// LED
		const led = i < 3 ? 0x22cc55 : i === 3 ? 0xffaa22 : 0x666666;
		g.circle(x + w - 8, sy + 3.5, 1.5);
		g.fill(led);

		// Vent holes
		for (let v = 0; v < 3; v++) {
			g.rect(x + 7 + v * 5, sy + 2.5, 3, 2);
			g.fill(PAL.rackFrame);
		}
	}
}

/** Draw a desk lamp */
export function drawLamp(
	g: Graphics,
	x: number,
	y: number,
): void {
	// Base
	g.ellipse(x + 8, y + 20, 7, 3);
	g.fill(0x555555);

	// Pole
	g.rect(x + 7, y + 10, 2, 10);
	g.fill(0x888888);

	// Shade
	g.moveTo(x + 1, y + 10);
	g.lineTo(x + 15, y + 10);
	g.lineTo(x + 12, y + 3);
	g.lineTo(x + 4, y + 3);
	g.closePath();
	g.fill(0xffdd55);

	// Light glow
	g.ellipse(x + 8, y + 12, 5, 2);
	g.fill({ color: 0xffffcc, alpha: 0.3 });
}
