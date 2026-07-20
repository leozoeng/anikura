type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
};

/** Consistent section header with soft brand eyebrow. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className = "",
}: Props) {
  return (
    <div className={className}>
      {eyebrow ? (
        <p className="section-eyebrow">{eyebrow}</p>
      ) : null}
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-sub">{subtitle}</p> : null}
    </div>
  );
}
