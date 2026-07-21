-- Scope anime_comments to a specific watch episode (anime + episode + sub/dub)

alter table public.anime_comments
  add column if not exists episode integer,
  add column if not exists language text;

update public.anime_comments
set
  episode = coalesce(episode, 1),
  language = coalesce(nullif(language, ''), 'sub')
where episode is null or language is null or language = '';

alter table public.anime_comments
  alter column episode set not null,
  alter column language set not null;

alter table public.anime_comments
  drop constraint if exists anime_comments_language_check;

alter table public.anime_comments
  add constraint anime_comments_language_check
  check (language in ('sub', 'dub'));

alter table public.anime_comments
  drop constraint if exists anime_comments_episode_positive;

alter table public.anime_comments
  add constraint anime_comments_episode_positive
  check (episode >= 1);

drop index if exists public.anime_comments_anime_created_idx;

create index if not exists anime_comments_episode_created_idx
  on public.anime_comments (anime_id, episode, language, created_at desc);
