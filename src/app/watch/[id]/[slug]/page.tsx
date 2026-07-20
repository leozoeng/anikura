import { notFound } from "next/navigation";
import { WatchExperience } from "@/components/watch-experience";
import { resolveAniListForAnime } from "@/lib/anilist";
import { getGenres, getSeries, watchHref } from "@/lib/anikoto";
import { getCatalog } from "@/lib/catalog";
import { buildEmbedServers } from "@/lib/embeds";
import {
  enrichEpisodesWithMeta,
  episodeDisplayTitle,
  isGenericTitle,
  resolveEpisodeMeta,
} from "@/lib/episode-meta";
import {
  buildMoreLikeThis,
  buildRelatedEntries,
  resolveFranchiseSeasons,
} from "@/lib/related";
import type { CatalogAnime } from "@/lib/types";

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

  const { anime } = series;

  const [anilist, catalog] = await Promise.all([
    resolveAniListForAnime(anime),
    getCatalog(),
  ]);

  const currentCatalog: CatalogAnime =
    catalog.find((c) => c.id === anime.id) ?? {
      ...anime,
      genres: getGenres(anime),
    };

  const episodeMeta = await resolveEpisodeMeta({
    aniListId: anilist?.id || Number(anime.ani_id) || undefined,
    streamingEpisodes: anilist?.streamingEpisodes,
  });

  const episodes = enrichEpisodesWithMeta(series.episodes, episodeMeta.titles);
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

  const showTitle = anilist?.title.english || anime.title;
  const episodeTitle = isGenericTitle(current.title, current.number)
    ? ""
    : episodeDisplayTitle(current);
  const episodeDescription =
    episodeMeta.descriptions[current.number]?.trim() || "";

  const score =
    anilist?.averageScore != null
      ? (anilist.averageScore / 10).toFixed(1)
      : anime.score && anime.score !== "N/A"
        ? anime.score
        : null;

  const seasons = await resolveFranchiseSeasons(
    anilist,
    catalog,
    currentCatalog,
  );
  const seasonIds = new Set(seasons.map((r) => r.match.id));
  const related = buildRelatedEntries(anilist, catalog, undefined, undefined, {
    excludeCatalogIds: seasonIds,
  });
  const relatedIds = new Set([
    ...seasonIds,
    ...related.map((r) => r.match.id),
  ]);
  const recommendations = buildMoreLikeThis(anilist, catalog, {
    excludeCatalogIds: [anime.id, ...relatedIds],
    excludeAniIds: [
      ...seasons.map((r) => r.media.id),
      ...related.map((r) => r.media.id),
    ],
    limit: 3,
  });

  const nextTitle = next ? episodeDisplayTitle(next) : undefined;

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
      episodeTitle={episodeTitle}
      score={score}
      year={anilist?.seasonYear || anime.year || null}
      genre={anilist?.genres?.[0] || null}
      episodeDescription={episodeDescription}
      poster={anilist?.coverImage?.large || anime.poster}
      banner={anilist?.bannerImage || anime.background_image || anime.poster}
      episodeThumbnails={episodeMeta.thumbnails}
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
      related={related}
      seasons={seasons}
      recommendations={recommendations}
      arcContext={{
        malId: anime.mal_id,
        aniId: anime.ani_id || (anilist?.id ? String(anilist.id) : undefined),
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
