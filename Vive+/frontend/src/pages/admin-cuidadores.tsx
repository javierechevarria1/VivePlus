"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCircle, XCircle, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import { C, T, R, btnPrimario, btnSecundario, distintivo, type Tono } from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, Buscador, Esqueleto, Fila, FilaAcciones, FilaPrincipal,
  Recuento, Segmentos, Vacio,
} from "@/frontend/src/components/admin/primitives";

type DocsEstado = "pendiente" | "en_revision" | "aprobado" | "rechazado";

type Cuidador = {
  id: number;
  nombre: string;
  especialidad: string;
  tipo: string;
  doc_identidad_url: string | null;
  doc_antecedentes_url: string | null;
  doc_residencia_url: string | null;
  docs_estado: DocsEstado;
  verificado: boolean;
};

const ESTADO: Record<DocsEstado, { texto: string; tono: Tono }> = {
  pendiente:   { texto: "Sin documentar", tono: "neutro" },
  en_revision: { texto: "En revisión",    tono: "info" },
  aprobado:    { texto: "Aprobado",       tono: "ok" },
  rechazado:   { texto: "Rechazado",      tono: "error" },
};

type Filtro = "revision" | "aprobados" | "rechazados" | "todos";

// Los tres documentos son la razón de ser de esta pantalla: se muestran como
// enlaces siempre visibles, no escondidos tras un desplegable.
function Documento({ url, texto }: { url: string | null; texto: string }) {
  if (!url) {
    return (
      <span style={{
        ...distintivo("neutro"),
        opacity: 0.55, fontWeight: 600,
      }}>
        <FileText size={11} /> {texto}: falta
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...distintivo("marca"), textDecoration: "none" }}
    >
      <FileText size={11} /> {texto} <ExternalLink size={10} />
    </a>
  );
}

function CuidadorFila({ c, ocupado, onAccion }: {
  c: Cuidador;
  ocupado: boolean;
  onAccion: (id: number, accion: "aprobar" | "rechazar") => void;
}) {
  const est = ESTADO[c.docs_estado];

  return (
    <Fila destacada={c.docs_estado === "en_revision"}>
      <div style={{
        width: 38, height: 38, borderRadius: R.pildora, flexShrink: 0,
        background: C.marcaSuave, color: C.marca,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: T.dato, fontWeight: 700,
      }}>
        {c.nombre.trim().charAt(0).toUpperCase() || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <FilaPrincipal
          titulo={c.nombre}
          meta={[c.especialidad, c.tipo].filter(Boolean).join(" · ") || "Sin especialidad"}
        >
          <span style={distintivo(est.tono)}>{est.texto}</span>
          {c.verificado && (
            <span style={distintivo("ok")}><CheckCircle size={11} /> Verificado</span>
          )}
        </FilaPrincipal>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
          <Documento url={c.doc_identidad_url}    texto="Identidad" />
          <Documento url={c.doc_antecedentes_url} texto="Antecedentes" />
          <Documento url={c.doc_residencia_url}   texto="Residencia" />
        </div>
      </div>

      <FilaAcciones>
        {c.docs_estado === "en_revision" && (
          <>
            <button
              type="button"
              onClick={() => onAccion(c.id, "rechazar")}
              disabled={ocupado}
              style={{ ...btnSecundario, color: C.error, borderColor: "#FBD5D5", opacity: ocupado ? 0.6 : 1 }}
            >
              <XCircle size={13} /> Rechazar
            </button>
            <button
              type="button"
              onClick={() => onAccion(c.id, "aprobar")}
              disabled={ocupado}
              style={{ ...btnPrimario, background: C.ok, opacity: ocupado ? 0.6 : 1 }}
            >
              <CheckCircle size={13} /> Aprobar
            </button>
          </>
        )}

        {c.docs_estado === "aprobado" && (
          <button
            type="button"
            onClick={() => onAccion(c.id, "rechazar")}
            disabled={ocupado}
            style={{ ...btnSecundario, color: C.error, borderColor: "#FBD5D5", opacity: ocupado ? 0.6 : 1 }}
          >
            <XCircle size={13} /> Revocar
          </button>
        )}

        {c.docs_estado === "rechazado" && (
          <button
            type="button"
            onClick={() => onAccion(c.id, "aprobar")}
            disabled={ocupado}
            style={{ ...btnSecundario, opacity: ocupado ? 0.6 : 1 }}
          >
            <CheckCircle size={13} /> Aprobar igualmente
          </button>
        )}
      </FilaAcciones>
    </Fila>
  );
}

export default function AdminCuidadoresPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [ocupado,    setOcupado]    = useState<number | null>(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtro,     setFiltro]     = useState<Filtro>("revision");

  const fetchCuidadores = useCallback(async () => {
    try {
      const res = await fetch("/api/admin-cuidadores");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error cargando cuidadores"); return; }
      setCuidadores(data.cuidadores);
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void fetchCuidadores(); }, [fetchCuidadores]);

  const handleAccion = async (medicoId: number, accion: "aprobar" | "rechazar") => {
    setOcupado(medicoId);
    try {
      const res = await fetch("/api/admin-cuidadores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicoId, accion }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
      setCuidadores(prev =>
        prev.map(c =>
          c.id === medicoId
            ? { ...c, docs_estado: accion === "aprobar" ? "aprobado" : "rechazado", verificado: accion === "aprobar" }
            : c
        )
      );
    } catch {
      setError("Error de conexión");
    } finally {
      setOcupado(null);
    }
  };

  const enRevision = cuidadores.filter(c => c.docs_estado === "en_revision");
  const aprobados  = cuidadores.filter(c => c.docs_estado === "aprobado");
  const rechazados = cuidadores.filter(c => c.docs_estado === "rechazado");

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const porFiltro =
      filtro === "revision"   ? enRevision :
      filtro === "aprobados"  ? aprobados  :
      filtro === "rechazados" ? rechazados : cuidadores;
    return porFiltro.filter(c =>
      !texto ||
      c.nombre.toLowerCase().includes(texto) ||
      (c.especialidad ?? "").toLowerCase().includes(texto)
    );
  }, [cuidadores, enRevision, aprobados, rechazados, filtro, busqueda]);

  return (
    <AdminShell
      titulo="Verificación de cuidadores"
      descripcion={
        enRevision.length > 0
          ? <>Hay <strong style={{ color: C.aviso }}>{enRevision.length} expediente{enRevision.length !== 1 ? "s" : ""} esperando revisión</strong>.</>
          : "No queda ningún expediente pendiente de revisar."
      }
      kpis={[
        { etiqueta: "En revisión", valor: enRevision.length, tono: enRevision.length > 0 ? "aviso" : undefined },
        { etiqueta: "Aprobados",   valor: aprobados.length,  tono: "ok" },
        { etiqueta: "Rechazados",  valor: rechazados.length, tono: rechazados.length > 0 ? "error" : undefined },
        { etiqueta: "Registrados", valor: cuidadores.length },
      ]}
    >
      {error && <Aviso>{error}</Aviso>}

      {cargando ? (
        <Esqueleto filas={4} />
      ) : (
        <>
          <Barra>
            <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar por nombre o especialidad…" />
            <Segmentos<Filtro>
              valor={filtro}
              onCambio={setFiltro}
              opciones={[
                { valor: "revision",   texto: "En revisión", cuenta: enRevision.length },
                { valor: "aprobados",  texto: "Aprobados",   cuenta: aprobados.length },
                { valor: "rechazados", texto: "Rechazados",  cuenta: rechazados.length },
                { valor: "todos",      texto: "Todos",       cuenta: cuidadores.length },
              ]}
            />
            <Recuento>{visibles.length} de {cuidadores.length}</Recuento>
          </Barra>

          {visibles.length === 0 ? (
            <Vacio
              icono={<ShieldCheck size={24} />}
              titulo={
                cuidadores.length === 0 ? "Todavía no hay cuidadores registrados"
                : filtro === "revision" ? "Nada pendiente de revisar"
                : "Ningún cuidador coincide"
              }
              texto={
                cuidadores.length === 0
                  ? "Cuando un profesional complete su alta y suba la documentación, aparecerá aquí."
                  : filtro === "revision"
                    ? "Todos los expedientes enviados están ya resueltos."
                    : "Prueba con otro término o cambia el filtro."
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibles.map(c => (
                <CuidadorFila key={c.id} c={c} ocupado={ocupado === c.id} onAccion={handleAccion} />
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
