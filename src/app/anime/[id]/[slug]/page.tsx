import { notFound } from "next/navigation";
import { AnimeDetailHero } from "@/components/anime-detail-hero";
import { EpisodeList } from "@/components/episode-list";
import { ExpandableText } from "@/components/expandable-text";
import { RelatedAnimeGrid } from "@/components/related-anime";
import { getAniListMedia, stripHtml } from "@/lib/anilist";
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
  const aniId = Number(anime.ani_id) || 0;
  const [anilist, catalog] = await Promise.all([
    aniId ? getAniListMedia(aniId) : Promise.resolve(null),
    getCatalog(),
  ]);

  const episodeMeta = await resolveEpisodeMeta({
    aniListId: aniId || anilist?.id,
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

  const seasons = await resolveFranchiseSeasons(anilist, catalog);
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
    limit: 18,
  });

  const trailerId =
    anilist?.trailer?.site?.toLowerCase() === "youtube"
      ? anilist.trailer.id
      : null;

  const episodeThumbnails = episodeMeta.thumbnails;
  const episodeFallbackImage = bg || poster;

  return (
    <div className="pb-24">
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

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <section>
            <h2 className="section-title">Story</h2>
            <ExpandableText text={description} className="mt-4 max-w-2xl" />
          </section>

          <aside className="space-y-5 lg:pt-2">
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-snow">
              Details
            </h3>
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
                      className="text-apple-blue hover:underline"
                    >
                      View on AniList
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        <RelatedAnimeGrid
          title="Seasons"
          subtitle="Prequels and sequels in this series"
          className="mt-14"
          items={seasons}
          badge={(item) =>
            "relationLabel" in item ? item.relationLabel : null
          }
        />

        <section className="mt-14">
          <h2 className="section-title">Episodes</h2>
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
          subtitle="Movies, spin-offs, and side stories"
          items={related}
          badge={(item) =>
            "relationLabel" in item ? item.relationLabel : null
          }
        />

        <RelatedAnimeGrid
          title="More like this"
          subtitle="Recommendations and similar titles"
          items={recommendations}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value || value === "&nbsp") return null;
  return (
    <div>
      <dt className="text-mute">{label}</dt>
      <dd className="mt-1 capitalize text-cloud">{value}</dd>
    </div>
  );
}
