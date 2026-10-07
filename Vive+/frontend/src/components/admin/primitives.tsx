"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import {
  C, T, R, FONT, SOMBRA,
  carta, btnIcono, btnPrimario, btnSecundario, btnPeligro,
  campo, etiqueta, distintivo, type Tono,
} from "./ui";

// ── Distintivo ────────────────────────────────────────────────────────────────

export function Distintivo({ tono = "neutro", children }: { tono?: Tono; children: React.ReactNode }) {
  return <span style={distintivo(tono)}>{children}</span>;
}

// ── Botón de icono ────────────────────────────────────────────────────────────
// `titulo` sirve de tooltip y de nombre accesible a la vez: los botones de
// icono sueltos son la fuente número uno de controles sin etiqueta.

export function BotonIcono({
  titulo, onClick, children, tono = "neutro", disabled,
}: {
  titulo: string;
  onClick: () => void;
  children: React.ReactNode;
  tono?: "neutro" | "peligro";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      className={tono === "peligro" ? "adm-icono adm-icono-peligro" : "adm-icono"}
      style={{
        ...btnIcono,
        ...(tono === "peligro" ? { color: C.error, borderColor: "#FBD5D5" } : null),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Fila de listado ───────────────────────────────────────────────────────────
// Todas las listas del panel comparten anatomía: una franja de color opcional,
// un bloque principal, datos alineados a la derecha, acciones y un cajón que se
// despliega. Tenerla en un sitio evita que cada página invente su propio alto.

export function Fila({
  franja, children, desplegado, atenuada, destacada,
}: {
  franja?: string;
  children: React.ReactNode;
  desplegado?: React.ReactNode;
  atenuada?: boolean;
  destacada?: boolean;
}) {
  return (
    <div
      className="adm-fila"
      style={{
        ...carta,
        overflow: "hidden",
        opacity: atenuada ? 0.65 : 1,
        borderColor: destacada ? "#F6DCA8" : C.borde,
      }}
    >
      <div className="adm-fila-interior" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
        {franja && (
          <div style={{ width: 4, alignSelf: "stretch", borderRadius: R.pildora, background: franja, flexShrink: 0 }} />
        )}
        {children}
      </div>
      {desplegado && (
        <div style={{ borderTop: `1px solid ${C.bordeTenue}`, background: C.velo, padding: "14px 16px" }}>
          {desplegado}
        </div>
      )}
    </div>
  );
}

export function FilaPrincipal({ titulo, meta, children }: { titulo: React.ReactNode; meta?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="adm-fila-principal" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: T.cuerpo, color: C.texto }}>{titulo}</span>
        {children}
      </div>
      {meta && (
        <p style={{
          margin: "3px 0 0", fontSize: T.micro, color: C.suave,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {meta}
        </p>
      )}
    </div>
  );
}

export function FilaDato({ valor, etiqueta: pie, color }: { valor: React.ReactNode; etiqueta: string; color?: string }) {
  return (
    <div style={{ flexShrink: 0, textAlign: "right" }}>
      <div style={{ fontSize: T.cuerpo, fontWeight: 700, color: color ?? C.texto, fontVariantNumeric: "tabular-nums" }}>
        {valor}
      </div>
      <div style={{ fontSize: T.micro, color: C.tenue, marginTop: 1 }}>{pie}</div>
    </div>
  );
}

export function FilaAcciones({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{children}</div>;
}

// ── Miniatura ─────────────────────────────────────────────────────────────────

export function Miniatura({ children, tamano = 44 }: { children: React.ReactNode; tamano?: number }) {
  return (
    <div style={{
      width: tamano, height: tamano, flexShrink: 0, borderRadius: R.medio,
      background: C.lienzo, border: `1px solid ${C.bordeTenue}`,
      overflow: "hidden", position: "relative",
    }}>
      {children}
    </div>
  );
}

// ── Estados de la lista ───────────────────────────────────────────────────────

export function Vacio({ icono, titulo, texto, accion }: {
  icono: React.ReactNode;
  titulo: string;
  texto?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div style={{ ...carta, textAlign: "center", padding: "48px 24px" }}>
      <div style={{
        width: 56, height: 56, borderRadius: R.pildora, background: C.marcaSuave,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", color: C.marca,
      }}>
        {icono}
      </div>
      <p style={{ fontSize: T.seccion, fontWeight: 700, color: C.texto, margin: "0 0 6px" }}>{titulo}</p>
      {texto && <p style={{ fontSize: T.dato, color: C.suave, margin: "0 0 18px", lineHeight: 1.6 }}>{texto}</p>}
      {accion}
    </div>
  );
}

// Un esqueleto con la forma de la fila real evita el salto de layout que daba
// el «Cargando…» suelto que había antes.
export function Esqueleto({ filas = 4 }: { filas?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} style={{ ...carta, height: 68, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
          <div className="adm-latido" style={{ width: 44, height: 44, borderRadius: R.medio, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <div className="adm-latido" style={{ height: 11, width: `${38 + ((i * 13) % 30)}%`, borderRadius: 4 }} />
            <div className="adm-latido" style={{ height: 9, width: `${22 + ((i * 17) % 24)}%`, borderRadius: 4 }} />
          </div>
          <div className="adm-latido" style={{ width: 64, height: 22, borderRadius: 6, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

export function Aviso({ tono = "error", children }: { tono?: Tono; children: React.ReactNode }) {
  const t = tono === "error"
    ? { bg: C.errorSuave, bd: "#FBD5D5", fg: C.error }
    : { bg: C.avisoSuave, bd: "#FDE9B8", fg: C.aviso };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: t.bg, border: `1px solid ${t.bd}`, borderRadius: R.medio,
      padding: "11px 14px", fontSize: T.dato, color: t.fg, marginBottom: 16,
    }}>
      <AlertTriangle size={15} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

// ── Barra de herramientas ─────────────────────────────────────────────────────
// Buscar y filtrar era lo único que faltaba para que estas listas sirvieran con
// más de treinta registros; hasta ahora había que usar el buscador del navegador.

export function Barra({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

export function Buscador({ valor, onCambio, marcador }: { valor: string; onCambio: (v: string) => void; marcador: string }) {
  return (
    <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
      <Search size={15} color={C.tenue} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input
        value={valor}
        onChange={e => onCambio(e.target.value)}
        placeholder={marcador}
        aria-label={marcador}
        className="adm-campo"
        style={{ ...campo, padding: "9px 34px 9px 34px" }}
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambio("")}
          aria-label="Limpiar búsqueda"
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: C.tenue,
            display: "flex", padding: 3,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function Segmentos<V extends string>({ valor, onCambio, opciones }: {
  valor: V;
  onCambio: (v: V) => void;
  opciones: { valor: V; texto: string; cuenta?: number }[];
}) {
  return (
    <div style={{ display: "inline-flex", background: C.marcaSuave, borderRadius: R.chico, padding: 3, gap: 2 }}>
      {opciones.map(o => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            onClick={() => onCambio(o.valor)}
            aria-pressed={activo}
            style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: T.micro, fontWeight: 700, fontFamily: FONT,
              background: activo ? C.superficie : "transparent",
              color: activo ? C.marca : C.suave,
              boxShadow: activo ? "0 1px 3px rgba(15,23,42,0.10)" : "none",
              transition: "background-color .15s, color .15s",
            }}
          >
            {o.texto}
            {o.cuenta != null && (
              <span style={{ marginLeft: 6, opacity: 0.65, fontVariantNumeric: "tabular-nums" }}>{o.cuenta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Recuento({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: T.micro, color: C.tenue, marginLeft: "auto" }}>{children}</span>;
}

// ── Campo de formulario ───────────────────────────────────────────────────────

export function Campo({ id, titulo, ancho, pista, children }: {
  id: string;
  titulo: string;
  ancho?: boolean;
  pista?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={ancho ? { gridColumn: "1 / -1" } : undefined}>
      <label style={etiqueta} htmlFor={id}>{titulo}</label>
      {children}
      {pista && <p style={{ margin: "5px 0 0", fontSize: T.micro, color: C.tenue }}>{pista}</p>}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ titulo, subtitulo, onCerrar, children, ancho = 440 }: {
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: React.ReactNode;
  ancho?: number;
}) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const cerrarRef  = useRef(onCerrar);
  useEffect(() => { cerrarRef.current = onCerrar; });

  // El <dialog> nativo pone el foco dentro, lo atrapa mientras está abierto,
  // cierra con Escape y devuelve el foco al salir. Pulsar el fondo también
  // cierra: en un <dialog> el fondo llega como una pulsación sobre el propio
  // elemento, y se escucha aquí para no anunciarlo como un control.
  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;
    dialogo.showModal();
    dialogo.focus();
    const alPulsarFondo = (e: MouseEvent) => { if (e.target === dialogo) cerrarRef.current(); };
    dialogo.addEventListener("mousedown", alPulsarFondo);
    return () => {
      dialogo.removeEventListener("mousedown", alPulsarFondo);
      dialogo.close();
    };
  }, []);

  return (
    <>
      <dialog
        ref={dialogoRef}
        className="admin-modal"
        aria-label={titulo}
        tabIndex={-1}
        onCancel={e => { e.preventDefault(); onCerrar(); }}
        style={{
          position: "fixed", top: "50%", left: "50%", right: "auto", bottom: "auto",
          transform: "translate(-50%, -50%)", margin: 0,
          background: C.superficie, borderRadius: R.grande, border: `1px solid ${C.borde}`,
          padding: 0, maxWidth: ancho, width: "calc(100% - 32px)", boxShadow: SOMBRA.modal,
          fontFamily: FONT, outline: "none", overflow: "hidden",
        }}
      >
        <div style={{ padding: 24, maxHeight: "85vh", overflowY: "auto" }}>
          <h2 style={{ margin: 0, fontSize: T.seccion, fontWeight: 700, color: C.texto }}>{titulo}</h2>
          {subtitulo && <p style={{ margin: "4px 0 0", fontSize: T.dato, color: C.suave }}>{subtitulo}</p>}
          <div style={{ marginTop: 18 }}>{children}</div>
        </div>
      </dialog>
      <style>{`.admin-modal::backdrop { background: rgba(15,23,42,0.55); }`}</style>
    </>
  );
}

// ── Confirmación ──────────────────────────────────────────────────────────────
// Sustituye a los `confirm()` nativos que quedaban en marketplace, planes y
// anuncios: el mismo diálogo para los nueve listados.

export function Confirmar({
  titulo, mensaje, textoConfirmar = "Eliminar", onConfirmar, onCancelar, ocupado,
}: {
  titulo: string;
  mensaje: React.ReactNode;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  ocupado?: boolean;
}) {
  return (
    <Modal titulo={titulo} onCerrar={onCancelar} ancho={420}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: R.medio, background: C.errorSuave,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <AlertTriangle size={18} color={C.error} />
        </div>
        <p style={{ margin: 0, fontSize: T.dato, color: C.suave, lineHeight: 1.6 }}>{mensaje}</p>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancelar} style={btnSecundario}>Cancelar</button>
        <button type="button" onClick={onConfirmar} disabled={ocupado} style={{ ...btnPeligro, opacity: ocupado ? 0.7 : 1 }}>
          {ocupado ? "Eliminando…" : textoConfirmar}
        </button>
      </div>
    </Modal>
  );
}

// Guarda lo que hay que borrar y devuelve el diálogo ya montado, para que las
// páginas no tengan que repetir el mismo trío de estados.
export function useConfirmacion<D>() {
  const [pendiente, setPendiente] = useState<D | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = async (accion: (dato: D) => Promise<void>) => {
    if (!pendiente) return;
    setOcupado(true);
    try {
      await accion(pendiente);
      setPendiente(null);
    } finally {
      setOcupado(false);
    }
  };

  return { pendiente, pedir: setPendiente, cancelar: () => setPendiente(null), ocupado, ejecutar };
}

export { btnPrimario, btnSecundario, btnPeligro, campo, etiqueta };
