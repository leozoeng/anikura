import { SafeImage } from "@/components/safe-image";
import { SectionHeading } from "@/components/section-heading";
import type { AniListCharacterEdge } from "@/lib/anilist";

export type CharacterCard = {
  id: number;
  name: string;
  native?: string | null;
  image?: string | null;
  role?: string | null;
  voiceActor?: {
    id: number;
    name: string;
    image?: string | null;
  } | null;
};

export function charactersFromAniList(
  edges?: AniListCharacterEdge[] | null,
): CharacterCard[] {
  if (!edges?.length) return [];

  const cards: CharacterCard[] = [];
  for (const edge of edges) {
    const node = edge.node;
    if (!node?.id) continue;
    const name = node.name?.full?.trim();
    if (!name) continue;

    const va = edge.voiceActors?.[0];
    cards.push({
      id: node.id,
      name,
      native: node.name?.native,
      image: node.image?.large,
      role: edge.role,
      voiceActor: va?.id
        ? {
            id: va.id,
            name: va.name?.full?.trim() || "Unknown",
            image: va.image?.large,
          }
        : null,
    });
  }
  return cards;
}

function roleLabel(role?: string | null) {
  if (!role) return null;
  return role.replace(/_/g, " ").toLowerCase();
}

export function AnimeCharacters({
  characters,
  className = "mt-16",
}: {
  characters: CharacterCard[];
  className?: string;
}) {
  if (!characters.length) return null;

  return (
    <section className={className}>
      <SectionHeading
        title="Characters"
        subtitle="Main cast and Japanese voice actors."
      />

      <ul className="fade-x scrollbar-none mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-3.5">
        {characters.map((c) => (
          <li
            key={c.id}
            className="panel-soft flex w-[240px] shrink-0 snap-start items-center gap-3 p-3 sm:w-[260px] sm:gap-3.5 sm:p-3.5"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-[4.5rem] sm:w-[4.5rem]">
              {c.image ? (
                <SafeImage
                  src={c.image}
                  alt={c.name}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="h-full w-full bg-white/[0.04]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium tracking-[-0.02em] text-snow">
                {c.name}
              </p>
              {c.role ? (
                <p className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-mute">
                  {roleLabel(c.role)}
                </p>
              ) : null}
              {c.voiceActor ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/12">
                    {c.voiceActor.image ? (
                      <SafeImage
                        src={c.voiceActor.image}
                        alt={c.voiceActor.name}
                        fill
                        className="object-cover"
                        sizes="28px"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/[0.06]" />
                    )}
                  </div>
                  <p className="min-w-0 truncate text-xs text-cloud/90">
                    <span className="text-mute">VA </span>
                    {c.voiceActor.name}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
