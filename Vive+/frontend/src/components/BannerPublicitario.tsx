"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { anunciosService, type Anuncio } from "@/frontend/src/services/anunciosService";
import { ExternalLink } from "lucide-react";

const BP_LATERAL_LINK_BASE: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", position: "relative", width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", textDecoration: "none", transition: "transform 0.3s ease, box-shadow 0.3s ease", background: "white" };
const BP_LATERAL_BADGE: React.CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)", color: "#64748B", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", padding: "4px", textAlign: "center", textTransform: "uppercase", zIndex: 10 };
const BP_LINK_BASE: React.CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center", position: "relative", width: "100%", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)", textDecoration: "none", transition: "transform 0.3s ease, box-shadow 0.3s ease", background: "#FAF8FF" };
const BP_BADGE: React.CSSProperties = { position: "absolute", top: 0, right: 0, background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)", color: "white", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", padding: "4px 10px", borderBottomLeftRadius: 8, textTransform: "uppercase", zIndex: 10, display: "flex", alignItems: "center", gap: 4 };

export function BannerPublicitario({ ubicacion, lateral = false }: { ubicacion: string, lateral?: boolean }) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAds = async () => {
      try {
        const ads = await anunciosService.getAnunciosPorUbicacion(ubicacion);
        if (cancelled) return;
        if (ads && ads.length > 0) {
          setAnuncios(ads);
        }
      } catch (err) {
        if (!cancelled) console.error("Error cargando anuncios", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAds();

    return () => {
      cancelled = true;
    };
  }, [ubicacion]);

  useEffect(() => {
    if (anuncios.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % anuncios.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [anuncios.length]);

  const registrarClick = () => {
    const anuncioActual = anuncios[currentIndex];
    if (anuncioActual?.id) {
      anunciosService.registrarClic(anuncioActual.id).catch(() => {});
    }
  };

  if (loading || anuncios.length === 0) return null;

  const anuncioActual = anuncios[currentIndex];

  if (lateral) {
    return (
      <div style={{ width: "160px", height: "600px", position: "sticky", top: "100px" }}>
        <a 
          href={anuncioActual.url_destino} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={registrarClick}
          style={BP_LATERAL_LINK_BASE}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: "translateY(-4px)", boxShadow: "0 14px 40px rgba(0,0,0,0.12)" })}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "translateY(0)", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" })}
        >
          <div style={BP_LATERAL_BADGE}>
            Patrocinado
          </div>
          <Image
            key={anuncioActual.id}
            fill sizes="100vw"
            src={anuncioActual.imagen}
            alt={`Anuncio de ${anuncioActual.empresa}`}
            style={{
              objectFit: "contain",
              animation: "fadeIn 0.5s ease-in-out",
              borderRadius: "12px"
            }}
          />
        </a>
      </div>
    );
  }

  return (
    <div style={{
      margin: "2rem 0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      position: "relative"
    }}>
      <div style={{ position: "relative", width: "100%" }}>
        <a 
          href={anuncioActual.url_destino} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={registrarClick}
          style={BP_LINK_BASE}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" })}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: "translateY(0)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" })}
        >
          {/* Etiqueta de patrocinado */}
          <div style={BP_BADGE}>
            Publicidad <ExternalLink size={10} />
          </div>

          {/* Imagen del anuncio */}
          <Image
            key={anuncioActual.id}
            src={anuncioActual.imagen}
            alt={`Anuncio de ${anuncioActual.empresa}`}
            width={400}
            height={100}
            className="banner-pub-img"
            style={{
              width: "100%",
              objectFit: "contain",
              padding: "4px",
              animation: "fadeIn 0.5s ease-in-out",
              borderRadius: "8px"
            }}
          />
        </a>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
        .banner-pub-img { height: 100px; }
        @media(max-width:768px){ .banner-pub-img { height: 72px; } }
        @media(max-width:480px){ .banner-pub-img { height: 52px; } }
      `}</style>
    </div>
  );
}