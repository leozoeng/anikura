-- Profile accent color + ambient glow (Discord-style theme tint)

alter table public.profiles
  add column if not exists accent_hex text not null default '#5865F2',
  add column if not exists accent_ambient boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_accent_hex_format;

alter table public.profiles
  add constraint profiles_accent_hex_format
  check (accent_hex ~* '^#[0-9A-Fa-f]{6}$');
