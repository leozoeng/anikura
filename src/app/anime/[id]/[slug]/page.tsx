import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimeDetailHero } from "@/components/anime-detail-hero";
import { EpisodeList } from "@/components/episode-list";
import { getAniListMedia, stripHtml } from "@/lib/anilist";
import {
  getGenres,
  getSeries,
} from "@/lib/anikoto";
import { findAnimeById, getCatalog } from "@/lib/catalog";
import { resolveEpisodeThumbnails } from "@/lib/episode-thumbs";

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

  const { anime, episodes } = series;
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

  const recommendations =
    anilist?.recommendations?.nodes
      ?.map((n) => n.mediaRecommendation)
      .filter(Boolean)
      .map((m) => {
        const match = byAniId.get(m!.id);
        if (!match) return null;
        return { media: m!, match };
      })
      .filter(Boolean)
      .slice(0, 8) ?? [];

  const trailerId =
    anilist?.trailer?.site?.toLowerCase() === "youtube"
      ? anilist.trailer.id
      : null;

  const episodeThumbnails = await resolveEpisodeThumbnails({
    aniListId: aniId || anilist?.id,
    streamingEpisodes: anilist?.streamingEpisodes,
  });
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

      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="section-title">Story</h2>
          <p className="mt-4 max-w-2xl whitespace-pre-line text-[1.05rem] leading-relaxed text-cloud">
            {description}
          </p>

          <h2 className="mt-14 section-title">Episodes</h2>
          <EpisodeList
            anime={anime}
            episodes={episodes}
            hasDub={episodes.some((e) => e.embed_url?.dub)}
            fallbackImage={episodeFallbackImage}
            episodeThumbnails={episodeThumbnails}
          />

          {recommendations.length > 0 && (
            <section className="mt-14">
              <h2 className="section-title">More like this</h2>
              <p className="section-sub">Recommendations from AniList</p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {recommendations.map((item) => {
                  if (!item) return null;
                  const { media, match } = item;
                  return (
                    <Link
                      key={media.id}
                      href={`/anime/${match.id}/${match.slug}`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-raised ring-1 ring-white/8 transition group-hover:ring-white/25">
                        {(media.coverImage?.large || match.poster) && (
                          <Image
                            src={media.coverImage?.large || match.poster}
                            alt={media.title.english || media.title.romaji || ""}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-[1.03]"
                            sizes="180px"
                          />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm tracking-[-0.02em]">
                        {media.title.english || media.title.romaji}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
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
