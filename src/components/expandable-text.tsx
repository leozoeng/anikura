"use client";

import { useMemo, useState } from "react";

type Props = {
  text: string;
  /** Character threshold before collapsing. Default 420. */
  limit?: number;
  className?: string;
  textClassName?: string;
};

export function ExpandableText({
  text,
  limit = 420,
  className = "",
  textClassName = "text-[1.05rem] leading-relaxed text-cloud",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const needsCollapse = text.length > limit;

  const preview = useMemo(() => {
    if (!needsCollapse || expanded) return text;
    const slice = text.slice(0, limit);
    const breakAt = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
      slice.lastIndexOf("\n"),
      slice.lastIndexOf(" "),
    );
    const cut = breakAt > limit * 0.55 ? breakAt + 1 : limit;
    return text.slice(0, cut).trimEnd();
  }, [text, limit, needsCollapse, expanded]);

  if (!text) return null;

  return (
    <div className={className}>
      <p className={`whitespace-pre-line ${textClassName}`}>
        {preview}
        {needsCollapse && !expanded ? "… " : needsCollapse ? " " : null}
        {needsCollapse ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline text-[0.92em] font-medium text-mute/85 transition hover:text-cloud"
            aria-expanded={expanded}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
      </p>
    </div>
  );
}
