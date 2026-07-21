import Image from "next/image";
import Link from "next/link";

type Props = {
  withWordmark?: boolean;
  /** Pixel size of the mark */
  size?: number;
  className?: string;
  href?: string | null;
};

export function AnikuraMark({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/anikura-mark.png"
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      quality={100}
      className={`rounded-[0.45rem] object-cover ${className}`}
      style={{ width: size, height: size }}
      priority
    />
  );
}

export function AnikuraLogo({
  withWordmark = true,
  size = 34,
  className = "",
  href = "/",
}: Props) {
  const wordSize = Math.max(15, Math.round(size * 0.6));

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <AnikuraMark size={size} />
      {withWordmark && (
        <span
          className="font-semibold tracking-[-0.045em] text-snow"
          style={{ fontSize: wordSize }}
        >
          Anikura
        </span>
      )}
    </span>
  );

  if (href == null) return inner;

  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 transition hover:opacity-90"
      aria-label="Anikura home"
    >
      <span className="transition duration-200 group-hover:scale-[1.02]">
        {inner}
      </span>
    </Link>
  );
}
