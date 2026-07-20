export type StoryArc = {
  name: string;
  start: number;
  end: number;
};

/** Major One Piece arcs by episode number (broadcast order) */
const ONE_PIECE_ARCS: StoryArc[] = [
  { name: "Romance Dawn", start: 1, end: 3 },
  { name: "Orange Town", start: 4, end: 8 },
  { name: "Syrup Village", start: 9, end: 12 },
  { name: "Baratie", start: 13, end: 19 },
  { name: "Arlong Park", start: 20, end: 32 },
  { name: "Loguetown", start: 33, end: 44 },
  { name: "Reverse Mountain", start: 45, end: 47 },
  { name: "Whisky Peak", start: 48, end: 53 },
  { name: "Little Garden", start: 54, end: 61 },
  { name: "Drum Island", start: 62, end: 77 },
  { name: "Alabasta", start: 78, end: 92 },
  { name: "Post-Alabasta", start: 93, end: 98 },
  { name: "Goat Island", start: 99, end: 102 },
  { name: "Ruluka Island", start: 103, end: 105 },
  { name: "G-8", start: 106, end: 115 },
  { name: "Davy Back Fight", start: 116, end: 129 },
  { name: "Ocean's Dream", start: 130, end: 135 },
  { name: "Foxy's Return", start: 136, end: 138 },
  { name: "Water 7", start: 139, end: 195 },
  { name: "Enies Lobby", start: 196, end: 228 },
  { name: "Post-Enies Lobby", start: 229, end: 233 },
  { name: "Ice Hunter", start: 234, end: 240 },
  { name: "Thriller Bark", start: 241, end: 263 },
  { name: "Spa Island", start: 264, end: 268 },
  { name: "Sabaody Archipelago", start: 269, end: 283 },
  { name: "Amazon Lily", start: 284, end: 290 },
  { name: "Impel Down", start: 291, end: 316 },
  { name: "Marineford", start: 317, end: 336 },
  { name: "Post-War", start: 337, end: 342 },
  { name: "Return to Sabaody", start: 343, end: 352 },
  { name: "Fish-Man Island", start: 353, end: 393 },
  { name: "Z's Ambition", start: 394, end: 396 },
  { name: "Punk Hazard", start: 397, end: 421 },
  { name: "Dressrosa", start: 422, end: 516 },
  { name: "Silver Mine", start: 517, end: 522 },
  { name: "Zou", start: 523, end: 541 },
  { name: "Marine Rookie", start: 542, end: 544 },
  { name: "Whole Cake Island", start: 545, end: 629 },
  { name: "Reverie", start: 630, end: 632 },
  { name: "Wano Country", start: 633, end: 1088 },
  { name: "Egghead", start: 1089, end: 9999 },
];

type ArcContext = {
  malId?: string | null;
  aniId?: string | null;
  title?: string;
  slug?: string;
};

function isOnePiece(ctx: ArcContext) {
  const t = (ctx.title || ctx.slug || "").toLowerCase();
  if (t.includes("one piece") && !t.includes("piece of")) return true;
  if (ctx.malId === "21" || ctx.aniId === "21") return true;
  return false;
}

export function getArcForEpisode(
  ctx: ArcContext,
  episode: number,
): StoryArc | null {
  if (isOnePiece(ctx)) {
    return (
      ONE_PIECE_ARCS.find((a) => episode >= a.start && episode <= a.end) ||
      null
    );
  }
  return null;
}

export function getArcsForSeries(
  ctx: ArcContext,
  maxEpisode: number,
): StoryArc[] {
  if (isOnePiece(ctx)) {
    return ONE_PIECE_ARCS.filter((a) => a.start <= maxEpisode);
  }

  // Generic: group long series into ~100-ep sagas
  if (maxEpisode <= 24) return [];

  const chunk = maxEpisode > 200 ? 100 : 50;
  const arcs: StoryArc[] = [];
  for (let start = 1; start <= maxEpisode; start += chunk) {
    const end = Math.min(start + chunk - 1, maxEpisode);
    arcs.push({
      name: `Part ${Math.ceil(start / chunk)}`,
      start,
      end,
    });
  }
  return arcs;
}

export function getArcsInRange(
  arcs: StoryArc[],
  rangeStart: number,
  rangeEnd: number,
) {
  return arcs.filter((a) => a.end >= rangeStart && a.start <= rangeEnd);
}
