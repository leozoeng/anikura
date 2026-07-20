export type TermsByType = {
  genre?: string[];
  studios?: string[];
  producers?: string[];
  type?: string[];
};

export type AnimeSummary = {
  id: number;
  title: string;
  alternative?: string;
  titles?: string;
  native?: string;
  slug: string;
  rating?: string;
  poster: string;
  is_sub?: number;
  description?: string;
  aired?: string;
  season?: string;
  year?: number;
  status?: string;
  score?: string;
  mal_id?: string;
  episodes?: string;
  ani_id?: string;
  source?: string;
  s_id?: number;
  background_image?: string;
  updated_at?: string;
  next_air_schedule_time?: number;
  next_air_ep?: number;
  terms_by_type?: TermsByType;
};

export type Episode = {
  id: number;
  title: string;
  jp_title?: string;
  number: number;
  episode_embed_id: string;
  embed_url?: {
    sub?: string;
    dub?: string;
  };
  updated_at?: string;
};

export type SeriesResponse = {
  anime: AnimeSummary;
  episodes: Episode[];
};

export type CatalogAnime = AnimeSummary & {
  genres: string[];
};

export type GenreStat = {
  name: string;
  slug: string;
  count: number;
};

export type SyncMeta = {
  syncedAt: string;
  totalAnime: number;
  pagesFetched: number;
  totalPagesAvailable: number;
};
