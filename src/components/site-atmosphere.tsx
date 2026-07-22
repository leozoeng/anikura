/** Soft sakura night ambience shared across the site. */
export function SiteAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden contain-strict"
    >
      <div className="absolute -left-[20%] top-[-10%] h-[42vh] w-[42vh] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.1),transparent_68%)] blur-2xl sm:h-[55vh] sm:w-[55vh] sm:blur-3xl" />
      <div className="absolute -right-[15%] top-[30%] h-[38vh] w-[38vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.04),transparent_70%)] blur-2xl sm:h-[50vh] sm:w-[50vh] sm:blur-3xl" />
      <div className="absolute bottom-[-10%] left-[35%] hidden h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(255,179,199,0.07),transparent_70%)] blur-3xl sm:block" />
      <div className="absolute inset-0 opacity-[0.022] [background-image:radial-gradient(rgba(255,255,255,0.85)_0.55px,transparent_0.55px)] [background-size:22px_22px]" />
    </div>
  );
}
