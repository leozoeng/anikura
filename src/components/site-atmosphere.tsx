/** Soft sakura night ambience shared across the site. */
export function SiteAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.11),transparent_68%)] blur-3xl" />
      <div className="absolute -right-[15%] top-[30%] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.045),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-[-10%] left-[35%] h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(255,179,199,0.07),transparent_70%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.028] [background-image:radial-gradient(rgba(255,255,255,0.85)_0.55px,transparent_0.55px)] [background-size:20px_20px]" />
    </div>
  );
}
