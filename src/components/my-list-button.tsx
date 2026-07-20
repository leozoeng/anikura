"use client";

import { ListStatusButton } from "@/components/list-status-button";

/** @deprecated Prefer ListStatusButton — kept for existing call sites. */
export function MyListButton({
  id,
  slug,
  title,
  poster,
  className = "",
  variant = "icon",
}: {
  id: number;
  slug: string;
  title: string;
  poster: string;
  className?: string;
  variant?: "icon" | "pill";
}) {
  return (
    <ListStatusButton
      anime_id={id}
      slug={slug}
      title={title}
      poster={poster}
      className={className}
      variant={variant}
    />
  );
}
