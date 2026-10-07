"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { FadeUp } from "@/frontend/src/components/fade-up";

export interface FilterOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  active: string[];
  onToggle: (key: string) => void;
  resultWord?: string;
  resultCount?: number;
  loading?: boolean;
}

const FB_BTN_BASE: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 99,
  fontSize: 13, fontWeight: 600, cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "background-color 0.25s cubic-bezier(0.22,1,0.36,1), color 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s cubic-bezier(0.22,1,0.36,1)",
};

const FB_MOBILE_TOGGLE_BASE: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 20px", borderRadius: 99,
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "all .2s",
};

export function FilterBar({ options, active, onToggle, resultWord, resultCount, loading = false }: FilterBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const allKey    = options[0]?.key ?? "Todas";
  const activeSet = new Set(active);
  const isAll     = activeSet.has(allKey);
  const selected  = active.filter(k => k !== allKey);

  const pills = options.map(opt => {
    const isActive = activeSet.has(opt.key);
    const color    = opt.color ?? "var(--teal)";
    return (
      <button
        key={opt.key}
        type="button"
        onClick={() => onToggle(opt.key)}
        style={{
          ...FB_BTN_BASE,
          background: isActive ? color : "white",
          color: isActive ? "white" : "#64748B",
          border: `1.5px solid ${isActive ? "transparent" : "#EDE9FE"}`,
          boxShadow: isActive ? `0 6px 20px ${color}40` : "none",
        }}
        onMouseEnter={e => {
          if (!isActive) Object.assign(e.currentTarget.style, { color, borderColor: color, boxShadow: `0 4px 14px ${color}20` });
        }}
        onMouseLeave={e => {
          if (!isActive) Object.assign(e.currentTarget.style, { color: "#64748B", borderColor: "#EDE9FE", boxShadow: "none" });
        }}
      >
        {opt.icon}
        <span>{opt.label}</span>
        {opt.count !== undefined && (
          <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>{opt.count}</span>
        )}
      </button>
    );
  });

  const counter = resultWord !== undefined && resultCount !== undefined && (
    <p style={{ color: "var(--muted)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
      {loading ? "Cargando..." : (
        <>
          <strong style={{ color: "var(--teal)" }}>{resultCount}</strong>
          {" "}{resultCount !== 1 ? resultWord + (/[aeiouáéíóú]$/i.test(resultWord) ? "s" : "es") : resultWord}
          {!isAll && selected.length > 0 && ` · ${selected.join(", ")}`}
        </>
      )}
    </p>
  );

  return (
    <FadeUp>
      <style>{`
        .fb-desktop { display: flex !important; }
        .fb-mobile  { display: none  !important; }
        @media (max-width: 640px) {
          .fb-desktop { display: none  !important; }
          .fb-mobile  { display: flex  !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 40 }}>

        {/* Desktop: pills en línea */}
        <div className="fb-desktop" style={{ gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {pills}
        </div>

        {/* Mobile: botón hamburguesa + panel desplegable */}
        <div className="fb-mobile" style={{ flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              ...FB_MOBILE_TOGGLE_BASE,
              background: selected.length > 0 ? "var(--teal, #EC4899)" : "white",
              color: selected.length > 0 ? "white" : "#0F172A",
              border: `1.5px solid ${selected.length > 0 ? "transparent" : "#EDE9FE"}`,
              boxShadow: selected.length > 0 ? "0 6px 20px rgba(236,72,153,.30)" : "0 2px 8px rgba(0,0,0,.06)",
            }}
          >
            {menuOpen ? <X size={15} /> : <SlidersHorizontal size={15} />}
            Filtros
            {selected.length > 0 && (
              <span style={{
                background: "rgba(255,255,255,.28)", borderRadius: 99,
                padding: "1px 8px", fontSize: 12,
              }}>
                {selected.length}
              </span>
            )}
          </button>

          {menuOpen && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8,
              justifyContent: "center", width: "100%",
              padding: "12px 0",
              animation: "fb-drop .18s ease",
            }}>
              <style>{`@keyframes fb-drop { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`}</style>
              {pills}
            </div>
          )}
        </div>

        {counter}
      </div>
    </FadeUp>
  );
}
