import { notFound } from "next/navigation";
import { AnimeDetailHero } from "@/components/anime-detail-hero";
import { EpisodeList } from "@/components/episode-list";
import { ExpandableText } from "@/components/expandable-text";
import { RelatedAnimeGrid } from "@/components/related-anime";
import { SeasonsSection } from "@/components/seasons-section";
import { SectionHeading } from "@/components/section-heading";
import { resolveAniListForAnime, stripHtml } from "@/lib/anilist";
import { getGenres, getSeries } from "@/lib/anikoto";
import { findAnimeById, getCatalog } from "@/lib/catalog";
import {
  enrichEpisodesWithMeta,
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
};

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isFinite(animeId)) notFound();

  let series;
  try {
    series = await getSeries(animeId);
  } catch {
    const cached = await findAnimeById(animeId);
    if (!cached) notFound();
    series = { anime: cached, episodes: [] };
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

  const title = anilist?.title.english || anime.title;
  const native = anilist?.title.native || anime.native;
  const description =
    stripHtml(anilist?.description) ||
    anime.description ||
    "No synopsis available.";
  const genres = anilist?.genres?.length ? anilist.genres : getGenres(anime);
  const bg =
    anilist?.bannerImage || anime.background_image || anime.poster;
  const poster =
    anilist?.coverImage?.extraLarge ||
    anilist?.coverImage?.large ||
    anime.poster;
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
    // 2 rows × up to 6 cols on the detail “More like this” grid
    limit: 12,
  });

  const trailerId =
    anilist?.trailer?.site?.toLowerCase() === "youtube"
      ? anilist.trailer.id
      : null;

  const episodeThumbnails = episodeMeta.thumbnails;
  const episodeFallbackImage = bg || poster;
  const aniId = anilist?.id || Number(anime.ani_id) || 0;

  return (
    <div className="relative pb-28">
      <AnimeDetailHero
        title={title}
        native={native}
        poster={poster}
        banner={bg}
        trailerId={trailerId}
        status={anime.status || anilist?.status}
        score={score ?? undefined}
        year={anilist?.seasonYear || anime.year}
        episodeCount={anilist?.episodes || anime.episodes}
        genres={genres}
        anime={anime}
        episodes={episodes}
        hasDub={episodes.some((e) => e.embed_url?.dub)}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.12),transparent_70%)] blur-2xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-12">
          <section className="panel-soft animate-rise p-6 sm:p-8">
            <SectionHeading
              title="Story"
              subtitle="Settle in — here’s what this one is about."
            />
            <ExpandableText text={description} className="mt-5 max-w-2xl" />
          </section>

          <aside className="panel-soft animate-rise space-y-5 p-6 sm:p-7 [animation-delay:80ms]">
            <div className="flex items-center gap-2">
              <span className="sakura-dot h-1.5 w-1.5 rounded-full bg-sakura" />
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-snow">
                Details
              </h3>
            </div>
            <dl className="space-y-4 text-sm">
              <Info label="Aired" value={anime.aired} />
              <Info
                label="Studios"
                value={
                  anilist?.studios?.nodes?.map((s) => s.name).join(", ") ||
                  anime.terms_by_type?.studios?.join(", ")
                }
              />
              <Info
                label="Type"
                value={anime.terms_by_type?.type?.join(", ")}
              />
              <Info label="Source" value={anime.source?.replace("_", " ")} />
              {aniId > 0 && (
                <div>
                  <dt className="text-mute">AniList</dt>
                  <dd className="mt-1">
                    <a
                      href={`https://anilist.co/anime/${aniId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sakura-soft transition hover:text-sakura-mist"
                    >
                      View on AniList ↗
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        <SeasonsSection seasons={seasons} className="mt-16" />

        <section className="mt-16">
          <SectionHeading
            title="Episodes"
            subtitle="Pick a scene and settle in."
          />
          <EpisodeList
            anime={anime}
            episodes={episodes}
            hasDub={episodes.some((e) => e.embed_url?.dub)}
            fallbackImage={episodeFallbackImage}
            episodeThumbnails={episodeThumbnails}
          />
        </section>

        <RelatedAnimeGrid
          title="Related"
          subtitle="Movies, spin-offs, and side stories nearby."
          items={related}
          badge={(item) =>
            "relationLabel" in item ? item.relationLabel : null
          }
        />

        <RelatedAnimeGrid
          title="More like this"
          subtitle="If this mood worked, try these next."
          items={recommendations}
          maxRows={2}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value || value === "&nbsp") return null;
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mute">
        {label}
      </dt>
      <dd className="mt-1.5 capitalize tracking-[-0.01em] text-cloud">{value}</dd>
    </div>
  );
}
