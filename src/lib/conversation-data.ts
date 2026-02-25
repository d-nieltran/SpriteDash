export interface ConversationScript {
	lines: { speaker: 0 | 1; text: string }[];
	/** If set, only matches when both IDs are present (order doesn't matter) */
	matchIds?: [string, string];
}

const GENERIC_SCRIPTS: ConversationScript[] = [
	{
		lines: [
			{ speaker: 0, text: "How's your queue?" },
			{ speaker: 1, text: "Clear for now!" },
			{ speaker: 0, text: "Nice, same here" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Coffee break?" },
			{ speaker: 1, text: "Always." },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Any errors today?" },
			{ speaker: 1, text: "Just one retry" },
			{ speaker: 0, text: "Not bad!" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "New deploy?" },
			{ speaker: 1, text: "Yep, went smooth" },
			{ speaker: 0, text: "Love it" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Busy day, huh?" },
			{ speaker: 1, text: "Tell me about it" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Seen the metrics?" },
			{ speaker: 1, text: "All green!" },
			{ speaker: 0, text: "Let's keep it that way" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Need any help?" },
			{ speaker: 1, text: "I'm good, thanks!" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "What a week..." },
			{ speaker: 1, text: "Friday yet?" },
			{ speaker: 0, text: "Almost!" },
		],
	},
];

const PROJECT_SCRIPTS: ConversationScript[] = [
	{
		matchIds: ["spoolprices-worker", "oncstrata-worker"],
		lines: [
			{ speaker: 0, text: "How big is your DB now?" },
			{ speaker: 1, text: "350MB and growing..." },
			{ speaker: 0, text: "Mine's tiny compared" },
		],
	},
	{
		matchIds: ["oncstrata-worker", "nccn-monitor-worker"],
		lines: [
			{ speaker: 0, text: "Any NCCN updates?" },
			{ speaker: 1, text: "New guideline dropped!" },
			{ speaker: 0, text: "I'll sync it next run" },
		],
	},
	{
		matchIds: ["kol-sync-worker", "oncstrata-worker"],
		lines: [
			{ speaker: 0, text: "Open Payments refreshed" },
			{ speaker: 1, text: "Good, I need that data" },
		],
	},
	{
		matchIds: ["oncology-sync-worker", "kol-sync-worker"],
		lines: [
			{ speaker: 0, text: "49 categories is a lot" },
			{ speaker: 1, text: "Try syncing 9M rows!" },
			{ speaker: 0, text: "Fair point..." },
		],
	},
	{
		matchIds: ["spoolprices-worker", "nccn-monitor-worker"],
		lines: [
			{ speaker: 0, text: "Price check done!" },
			{ speaker: 1, text: "Guideline check done!" },
			{ speaker: 0, text: "Team effort." },
		],
	},
];

const SONNE_CASUAL_SCRIPTS: ConversationScript[] = [
	{
		lines: [
			{ speaker: 0, text: "Status report?" },
			{ speaker: 1, text: "All systems go, boss" },
			{ speaker: 0, text: "Music to my ears" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Everything running?" },
			{ speaker: 1, text: "Smooth as butter" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Great work today" },
			{ speaker: 1, text: "Thanks, boss!" },
		],
	},
	{
		lines: [
			{ speaker: 0, text: "Keep it up, team" },
			{ speaker: 1, text: "You got it!" },
		],
	},
];

export const TRIGGER_SCRIPTS: Record<string, ConversationScript> = {
	"spoolprices-worker": {
		lines: [
			{ speaker: 0, text: "Run the price check!" },
			{ speaker: 1, text: "On it, boss!" },
			{ speaker: 0, text: "Let me know when done" },
		],
	},
	"oncstrata-worker": {
		lines: [
			{ speaker: 0, text: "Sync the trials now!" },
			{ speaker: 1, text: "Firing up the lab..." },
		],
	},
	"kol-sync-worker": {
		lines: [
			{ speaker: 0, text: "Update the KOL data!" },
			{ speaker: 1, text: "Opening the books..." },
		],
	},
	"oncology-sync-worker": {
		lines: [
			{ speaker: 0, text: "Deliver the next batch!" },
			{ speaker: 1, text: "Package incoming!" },
		],
	},
	"nccn-monitor-worker": {
		lines: [
			{ speaker: 0, text: "Check for new guidelines!" },
			{ speaker: 1, text: "On the case!" },
		],
	},
};

/**
 * Pick a conversation between two workers.
 * speaker 0 = idA, speaker 1 = idB
 */
export function pickConversation(
	idA: string,
	idB: string,
): ConversationScript {
	const isSonne = idA === "sonne-manager" || idB === "sonne-manager";

	// 60% chance of project-specific or sonne-specific match
	if (Math.random() < 0.6) {
		if (isSonne) {
			const pick =
				SONNE_CASUAL_SCRIPTS[
					Math.floor(Math.random() * SONNE_CASUAL_SCRIPTS.length)
				];
			return pick;
		}

		const specific = PROJECT_SCRIPTS.filter(
			(s) =>
				s.matchIds &&
				s.matchIds.includes(idA) &&
				s.matchIds.includes(idB),
		);
		if (specific.length > 0) {
			return specific[Math.floor(Math.random() * specific.length)];
		}
	}

	return GENERIC_SCRIPTS[Math.floor(Math.random() * GENERIC_SCRIPTS.length)];
}
