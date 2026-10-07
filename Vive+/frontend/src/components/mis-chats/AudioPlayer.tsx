"use client";

import { useState, useRef, type MouseEvent } from "react";

// Componente reproductor de audio de los chats (extraído de mis-chats.tsx).
const MC_PLAY_BTN_BASE: React.CSSProperties = { width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", color: "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity .15s" };
const MC_SEEK_DOT_BASE: React.CSSProperties = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", pointerEvents: "auto", userSelect: "none" };
const fmt = (s: number) => isNaN(s) || !isFinite(s) || s < 0 ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const BARS = [3, 6, 9, 5, 8, 4, 10, 6, 8, 5, 9, 4, 7, 10, 5, 8, 4, 9, 6, 8, 5, 10, 4, 7, 6];

export function AudioPlayer({ src, isCare }: { src: string; isCare: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const fixingRef     = useRef(false);
  const isDraggingRef = useRef(false);
  const [isDragging,   setIsDragging]   = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveRef.current || !duration || !isFinite(duration)) return;
    const rect = waveRef.current.getBoundingClientRect();
    if (!rect.width) return;
    audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    (e as React.MouseEvent).stopPropagation?.();
    isDraggingRef.current = true;
    setIsDragging(true);
    const getX = (ev: Event) =>
      "touches" in ev ? (ev as unknown as TouchEvent).touches[0]?.clientX ?? 0 : (ev as unknown as MouseEvent).clientX;
    const onMove = (ev: Event) => {
      ev.preventDefault();
      if (!waveRef.current) return;
      const rect = waveRef.current.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.max(0, Math.min(1, (getX(ev) - rect.left) / rect.width));
      setDragProgress(ratio);
      if (audioRef.current && duration && isFinite(duration)) audioRef.current.currentTime = ratio * duration;
    };
    const onUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragProgress(null);
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchend", onUp);
    };
    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove as EventListener, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  const progress          = duration > 0 && isFinite(duration) ? current / duration : 0;
  const effectiveProgress = dragProgress !== null ? dragProgress : progress;

  const activeColor   = isCare ? "rgba(255,255,255,0.95)" : "var(--sage)";
  const inactiveColor = isCare ? "rgba(255,255,255,0.28)" : "var(--ink-faint)";
  const btnBg         = isCare ? "rgba(255,255,255,0.2)" : "var(--sage)";
  const timeColor     = isCare ? "rgba(255,255,255,0.55)" : "var(--ink-light)";
  const dotColor      = isCare ? "#fff" : "var(--sage)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 210 }}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        style={{ display: "none" }}
        onLoadedMetadata={e => {
          const a = e.target as HTMLAudioElement;
          if (!isFinite(a.duration)) { fixingRef.current = true; a.currentTime = 1e10; }
          else setDuration(a.duration);
        }}
        onDurationChange={e => {
          const a = e.target as HTMLAudioElement;
          if (isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
        }}
        onSeeked={e => {
          if (fixingRef.current) { fixingRef.current = false; (e.target as HTMLAudioElement).currentTime = 0; }
        }}
        onTimeUpdate={e => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button type="button" onClick={toggle} aria-label={playing ? "Pausar" : "Reproducir"} style={{ ...MC_PLAY_BTN_BASE, background: btnBg, flexShrink: 0 }}>
        {playing
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>
      <div style={{ flex: 1 }}>
        <div
          ref={waveRef}
          role="slider"
          tabIndex={0}
          aria-label="Progreso del audio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(effectiveProgress * 100)}
          onClick={handleSeek}
          onKeyDown={e => {
            if (!audioRef.current || !duration || !isFinite(duration)) return;
            if (e.key === "ArrowRight") audioRef.current.currentTime = Math.min(duration, current + 5);
            else if (e.key === "ArrowLeft") audioRef.current.currentTime = Math.max(0, current - 5);
          }}
          style={{ position: "relative", display: "flex", alignItems: "center", gap: 2, height: 22, cursor: "pointer" }}
        >
          {BARS.map((h, i) => (
            <div key={`b${i}`} style={{ flex: 1, minWidth: 2, borderRadius: 2, height: `${Math.round((h / 10) * 20)}px`, background: (i + 1) / BARS.length <= effectiveProgress ? activeColor : inactiveColor, transition: "background .08s" }} />
          ))}
          {/* El punto solo dibuja la posición; el control accesible es la barra
              que lo contiene, que ya es un slider con teclado. */}
          <div
            aria-hidden="true"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            style={{ ...MC_SEEK_DOT_BASE, left: `calc(${effectiveProgress * 100}% - 6px)`, background: dotColor, cursor: isDragging ? "grabbing" : "grab", transition: isDragging ? "none" : "left .08s" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontVariantNumeric: "tabular-nums", color: timeColor, marginTop: 2 }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
