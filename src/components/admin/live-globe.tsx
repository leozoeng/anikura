"use client";

import createGlobe from "cobe";
import { useEffect, useMemo, useRef, useState } from "react";

export type GlobePerson = {
  id: string;
  lat: number | null;
  lng: number | null;
  country: string | null;
  city: string | null;
  path: string | null;
  device?: string | null;
  user_agent?: string | null;
  first_seen?: string | null;
  last_seen: string;
  session_id: string | null;
  user_id: string | null;
  email: string | null;
  nickname: string | null;
  username: string | null;
  path_label?: string | null;
  path_meta?: string | null;
};

type LiveGlobeProps = {
  people: GlobePerson[];
  selectedId: string | null;
  onSelect: (person: GlobePerson | null) => void;
  className?: string;
};

type Projected = {
  person: GlobePerson;
  x: number;
  y: number;
  z: number;
};

function projectMarker(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
): { x: number; y: number; z: number } {
  const λ = (lng * Math.PI) / 180 + phi;
  const φ = (lat * Math.PI) / 180;
  const cosφ = Math.cos(φ);
  const x = cosφ * Math.sin(λ);
  const y0 = Math.sin(φ);
  const z0 = cosφ * Math.cos(λ);
  const y = y0 * Math.cos(theta) - z0 * Math.sin(theta);
  const z = y0 * Math.sin(theta) + z0 * Math.cos(theta);
  return { x, y, z };
}

function focusAngles(lat: number, lng: number): { phi: number; theta: number } {
  return {
    phi: (-lng * Math.PI) / 180,
    theta: (lat * Math.PI) / 180 * 0.55,
  };
}

export function LiveGlobe({
  people,
  selectedId,
  onSelect,
  className,
}: LiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peopleRef = useRef(people);
  const selectedRef = useRef(selectedId);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.18);
  const widthRef = useRef(0);
  const scaleRef = useRef(1.05);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const lastPtr = useRef({ x: 0, y: 0 });
  const autoSpinRef = useRef(true);
  const focusTargetRef = useRef<{ phi: number; theta: number } | null>(null);
  const [hint, setHint] = useState("Drag to explore · click a dot");

  useEffect(() => {
    peopleRef.current = people;
  }, [people]);

  useEffect(() => {
    selectedRef.current = selectedId;
    if (!selectedId) return;
    const person = people.find((p) => p.id === selectedId);
    if (!person || person.lat == null || person.lng == null) return;
    focusTargetRef.current = focusAngles(person.lat, person.lng);
    autoSpinRef.current = false;
  }, [selectedId, people]);

  const markers = useMemo(
    () =>
      people
        .filter(
          (p): p is GlobePerson & { lat: number; lng: number } =>
            p.lat != null && p.lng != null,
        )
        .map((p) => ({
          location: [p.lat, p.lng] as [number, number],
          size: selectedId === p.id ? 0.085 : 0.045,
          color:
            selectedId === p.id
              ? ([1, 1, 1] as [number, number, number])
              : ([0.92, 0.92, 0.95] as [number, number, number]),
          id: p.id,
        })),
    [people, selectedId],
  );
  const markersRef = useRef(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas;

    const measure = () => {
      if (el.parentElement) {
        widthRef.current = el.parentElement.offsetWidth;
      }
    };
    measure();
    window.addEventListener("resize", measure);

    const w = Math.max(widthRef.current, 320);
    const globe = createGlobe(el, {
      devicePixelRatio: 2,
      width: w * 2,
      height: w * 2,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.1,
      scale: scaleRef.current,
      mapSamples: 18_000,
      mapBrightness: 4.4,
      baseColor: [0.1, 0.1, 0.12],
      markerColor: [0.95, 0.95, 0.98],
      glowColor: [0.14, 0.14, 0.16],
      markers: markersRef.current,
    });

    let raf = 0;
    const tick = () => {
      const focus = focusTargetRef.current;
      if (focus) {
        const dPhi = focus.phi - phiRef.current;
        const wrap =
          ((dPhi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) -
          Math.PI;
        phiRef.current += wrap * 0.08;
        thetaRef.current += (focus.theta - thetaRef.current) * 0.08;
        if (Math.abs(wrap) < 0.01 && Math.abs(focus.theta - thetaRef.current) < 0.01) {
          focusTargetRef.current = null;
        }
      } else if (autoSpinRef.current && !draggingRef.current) {
        phiRef.current += 0.0018;
      }

      const size = Math.max(widthRef.current, 320) * 2;
      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        scale: scaleRef.current,
        markers: markersRef.current,
        width: size,
        height: size,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    el.style.opacity = "1";

    function projectPeople(): Projected[] {
      const size = Math.max(widthRef.current, 320);
      const r = (size / 2) * scaleRef.current;
      const cx = size / 2;
      const cy = size / 2;
      const out: Projected[] = [];
      for (const person of peopleRef.current) {
        if (person.lat == null || person.lng == null) continue;
        const p = projectMarker(
          person.lat,
          person.lng,
          phiRef.current,
          thetaRef.current,
        );
        if (p.z <= 0.08) continue;
        out.push({
          person,
          x: cx + p.x * r,
          y: cy - p.y * r,
          z: p.z,
        });
      }
      return out;
    }

    function nearestAt(clientX: number, clientY: number): GlobePerson | null {
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * Math.max(widthRef.current, 320);
      const y = ((clientY - rect.top) / rect.height) * Math.max(widthRef.current, 320);
      let best: Projected | null = null;
      let bestDist = 28;
      for (const p of projectPeople()) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      return best?.person ?? null;
    }

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      movedRef.current = false;
      autoSpinRef.current = false;
      focusTargetRef.current = null;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      setHint("Release to keep view · click a bright dot");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      if (Math.hypot(dx, dy) > 3) movedRef.current = true;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      phiRef.current += dx * 0.005;
      thetaRef.current = Math.max(
        -0.6,
        Math.min(0.85, thetaRef.current + dy * 0.004),
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      draggingRef.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      if (!movedRef.current) {
        const hit = nearestAt(e.clientX, e.clientY);
        onSelect(hit);
        if (hit && hit.lat != null && hit.lng != null) {
          focusTargetRef.current = focusAngles(hit.lat, hit.lng);
          setHint("Visitor selected");
        } else if (hit) {
          setHint("Visitor selected");
        } else {
          setHint("Drag to explore · click a dot");
        }
      } else {
        setHint("Paused spin — drag again or click a dot");
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      autoSpinRef.current = false;
      scaleRef.current = Math.max(
        0.85,
        Math.min(1.55, scaleRef.current - e.deltaY * 0.0012),
      );
    };

    const onDblClick = () => {
      autoSpinRef.current = true;
      focusTargetRef.current = null;
      scaleRef.current = 1.05;
      thetaRef.current = 0.18;
      onSelect(null);
      setHint("Auto-spin resumed");
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("dblclick", onDblClick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", measure);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("dblclick", onDblClick);
    };
  }, [onSelect]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="cursor-grab touch-none active:cursor-grabbing"
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 0.8s ease",
        }}
        aria-label="Interactive live visitors globe"
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.7rem] text-mute">
        {hint} · double-click to resume spin
      </p>
    </div>
  );
}
