import { notFound } from "next/navigation";
import { WatchExperience } from "@/components/watch-experience";
import { decodeEntities, getAniListMedia, stripHtml } from "@/lib/anilist";
import { getSeries, watchHref } from "@/lib/anikoto";
import { getCatalog } from "@/lib/catalog";
import { buildEmbedServers } from "@/lib/embeds";
import { resolveEpisodeThumbnails } from "@/lib/episode-thumbs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; slug: string }>;
  searchParams: Promise<{ ep?: string; lang?: string; server?: string }>;
};

export default async function WatchPage({ params, searchParams }: Props) {
  const { id, slug } = await params;
  const { ep = "1", lang = "sub", server } = await searchParams;
  const animeId = Number(id);
  const episodeNum = Math.max(1, Number(ep) || 1);
  const language = lang === "dub" ? "dub" : "sub";

  if (!Number.isFinite(animeId)) notFound();

  let series;
  try {
    series = await getSeries(animeId);
  } catch {
    notFound();
  }

  const { anime, episodes } = series;
  const current =
    episodes.find((e) => e.number === episodeNum) || episodes[0];

  if (!current) notFound();

  const servers = buildEmbedServers({
    anime,
    episode: current,
    language,
  });

  const prev = episodes.find((e) => e.number === current.number - 1);
  const next = episodes.find((e) => e.number === current.number + 1);
  const hasDub = Boolean(
    current.embed_url?.dub || anime.ani_id || anime.mal_id,
  );
  const hasSub = Boolean(
    current.embed_url?.sub || anime.ani_id || anime.mal_id,
  );

  const watchBase = `/watch/${anime.id}/${slug || anime.slug}`;
  const prevHref = prev ? watchHref(anime, prev.number, language) : undefined;
  const nextHref = next ? watchHref(anime, next.number, language) : undefined;
  const aniId = Number(anime.ani_id) || 0;

  const [anilist, catalog] = await Promise.all([
    aniId ? getAniListMedia(aniId) : Promise.resolve(null),
    getCatalog(),
  ]);

  const byAniId = new Map<number, (typeof catalog)[number]>();
  for (const item of catalog) {
    const n = Number(item.ani_id);
    if (n) byAniId.set(n, item);
  }

  const episodeTitle = decodeEntities(current.title);
  const showTitle = anilist?.title.english || anime.title;
  const synopsis =
    stripHtml(anilist?.description) || anime.description || "";
  const shortSynopsis =
    synopsis.length > 280 ? `${synopsis.slice(0, 280).trim()}…` : synopsis;

  const score =
    anilist?.averageScore != null
      ? (anilist.averageScore / 10).toFixed(1)
      : anime.score && anime.score !== "N/A"
        ? anime.score
        : null;

  const recommendations =
    anilist?.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter(Boolean)
      .map((m) => {
        const match = byAniId.get(m!.id);
        if (!match) return null;
        return {
          media: {
            id: m!.id,
            title: m!.title,
            coverImage: m!.coverImage,
            seasonYear: m!.seasonYear ?? match.year ?? null,
          },
          match: {
            id: match.id,
            slug: match.slug,
            poster: match.poster,
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null) ?? [];

  const nextTitle = next
    ? decodeEntities(next.title) !== `Episode ${next.number}`
      ? decodeEntities(next.title)
      : `Episode ${next.number}`
    : undefined;

  const episodeThumbnails = await resolveEpisodeThumbnails({
    aniListId: aniId || anilist?.id,
    streamingEpisodes: anilist?.streamingEpisodes,
  });

  let nextAirLabel: string | null = null;
  if (anime.next_air_schedule_time) {
    const ms = anime.next_air_schedule_time * 1000 - Date.now();
    if (ms > 0) {
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
      const epLabel = anime.next_air_ep ? ` ep ${anime.next_air_ep}` : "";
      nextAirLabel =
        days <= 1
          ? `Next${epLabel} airing soon`
          : `Next${epLabel} airing in ${days} days`;
    }
  }

  return (
    <WatchExperience
      anime={anime}
      episodes={episodes}
      current={current}
      language={language}
      servers={servers}
      preferredServerId={server || null}
      watchBase={watchBase}
      showTitle={showTitle}
      episodeTitle={
        episodeTitle !== `Episode ${current.number}` ? episodeTitle : ""
      }
      score={score}
      year={anilist?.seasonYear || anime.year || null}
      genre={anilist?.genres?.[0] || null}
      shortSynopsis={shortSynopsis}
      poster={anilist?.coverImage?.large || anime.poster}
      banner={anilist?.bannerImage || anime.background_image || anime.poster}
      episodeThumbnails={episodeThumbnails}
      anilistMeta={{
        studios:
          anilist?.studios?.nodes?.map((s) => s.name).join(", ") ||
          anime.terms_by_type?.studios?.join(", "),
        genres: (anilist?.genres || anime.terms_by_type?.genre)
          ?.slice(0, 6)
          .join(" · "),
        status: anime.status || anilist?.status || undefined,
        totalEps: String(
          anilist?.episodes || anime.episodes || episodes.length,
        ),
      }}
      recommendations={recommendations.slice(0, 8)}
      arcContext={{
        malId: anime.mal_id,
        aniId: anime.ani_id,
        title: anime.title,
        slug: anime.slug,
      }}
      prevHref={prevHref}
      nextHref={nextHref}
      nextTitle={nextTitle}
      nextAirLabel={nextAirLabel}
      hasSub={hasSub}
      hasDub={hasDub}
      durationMin={24}
    />
  );
}
