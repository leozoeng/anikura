"use client";

import createGlobe, { type Marker } from "cobe";
import { useEffect, useRef } from "react";

export type GlobeMarker = Marker;

type LiveGlobeProps = {
  markers: GlobeMarker[];
  className?: string;
};

export function LiveGlobe({ markers, className }: LiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersRef = useRef(markers);
  const phiRef = useRef(0);
  const widthRef = useRef(0);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => {
      if (canvas.parentElement) {
        widthRef.current = canvas.parentElement.offsetWidth;
      }
    };
    measure();
    window.addEventListener("resize", measure);

    const w = Math.max(widthRef.current, 320);
    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: w * 2,
      height: w * 2,
      phi: 0,
      theta: 0.18,
      dark: 1,
      diffuse: 1.05,
      scale: 1.05,
      mapSamples: 18000,
      mapBrightness: 4.2,
      baseColor: [0.12, 0.12, 0.14],
      markerColor: [1, 0.55, 0.66],
      glowColor: [0.18, 0.16, 0.2],
      markers: markersRef.current,
    });

    let raf = 0;
    const tick = () => {
      phiRef.current += 0.0022;
      const size = Math.max(widthRef.current, 320) * 2;
      globe.update({
        phi: phiRef.current,
        markers: markersRef.current,
        width: size,
        height: size,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 0.8s ease",
        }}
        aria-label="Live visitors globe"
      />
    </div>
  );
}
