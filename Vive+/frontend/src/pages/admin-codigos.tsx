"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash2, Copy, Check, KeyRound } from "lucide-react";
import { codigosService, type Codigo } from "@/frontend/src/services/codigosService";
import { AdminShell } from "@/frontend/src/components/admin/AdminShell";
import { C, T, carta, btnPrimario } from "@/frontend/src/components/admin/ui";
import {
  Aviso, Barra, BotonIcono, Buscador, Confirmar, Esqueleto,
  Recuento, Segmentos, Vacio, useConfirmacion,
} from "@/frontend/src/components/admin/primitives";

type Filtro = "todos" | "libres" | "usados";

export default function AdminCodigosPage() {
  const [codigos,   setCodigos]   = useState<Codigo[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [copiado,   setCopiado]   = useState<number | null>(null);
  const [busqueda,  setBusqueda]  = useState("");
  const [filtro,    setFiltro]    = useState<Filtro>("todos");

  const borrado = useConfirmacion<Codigo>();

  const fetchCodigos = useCallback(async () => {
    try {
      const data = await codigosService.getCodigos();
      setCodigos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando códigos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void fetchCodigos(); }, [fetchCodigos]);

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      await codigosService.generarCodigo();
      await fetchCodigos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar código");
    } finally {
      setGenerando(false);
    }
  };

  const handleCopiar = async (id: number, codigo: string) => {
    await navigator.clipboard.writeText(codigo);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  };

  const libres = codigos.filter(c => !c.estado);
  const usados = codigos.filter(c =>  c.estado);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return codigos
      .filter(c => filtro === "todos" || (filtro === "libres" ? !c.estado : !!c.estado))
      .filter(c => !texto || c.codigo.toLowerCase().includes(texto));
  }, [codigos, filtro, busqueda]);

  return (
    <AdminShell
      titulo="Códigos de acceso"
      descripcion="Códigos de un solo uso para dar de alta a profesionales sanitarios."
      acciones={
        <button type="button" onClick={handleGenerar} disabled={generando} style={{ ...btnPrimario, opacity: generando ? 0.7 : 1 }}>
          <Plus size={14} /> {generando ? "Generando…" : "Nuevo código"}
        </button>
      }
      kpis={[
        { etiqueta: "Disponibles", valor: libres.length, tono: libres.length === 0 ? "aviso" : "ok" },
        { etiqueta: "Usados",      valor: usados.length },
        { etiqueta: "Total",       valor: codigos.length },
      ]}
    >
      {borrado.pendiente && (
        <Confirmar
          titulo="Eliminar código"
          mensaje={<>Se eliminará el código <strong style={{ color: C.texto, letterSpacing: "0.08em" }}>{borrado.pendiente.codigo}</strong>. Esta acción no se puede deshacer.</>}
          ocupado={borrado.ocupado}
          onCancelar={borrado.cancelar}
          onConfirmar={() => borrado.ejecutar(async c => {
            try {
              await codigosService.eliminarCodigo(c.id);
              await fetchCodigos();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al eliminar código");
            }
          })}
        />
      )}

      {error && <Aviso>{error}</Aviso>}

      {cargando ? (
        <Esqueleto filas={5} />
      ) : (
        <>
          <Barra>
            <Buscador valor={busqueda} onCambio={setBusqueda} marcador="Buscar código…" />
            <Segmentos<Filtro>
              valor={filtro}
              onCambio={setFiltro}
              opciones={[
                { valor: "todos",  texto: "Todos",       cuenta: codigos.length },
                { valor: "libres", texto: "Disponibles", cuenta: libres.length },
                { valor: "usados", texto: "Usados",      cuenta: usados.length },
              ]}
            />
            <Recuento>{visibles.length} de {codigos.length}</Recuento>
          </Barra>

          {visibles.length === 0 ? (
            <Vacio
              icono={<KeyRound size={24} />}
              titulo={codigos.length === 0 ? "Todavía no hay códigos" : "Ningún código coincide"}
              texto={
                codigos.length === 0
                  ? "Genera un código y entrégalo al profesional para que complete su alta."
                  : "Prueba con otro término o cambia el filtro."
              }
              accion={
                codigos.length === 0 ? (
                  <button type="button" onClick={handleGenerar} style={btnPrimario}>
                    <Plus size={14} /> Generar el primero
                  </button>
                ) : null
              }
            />
          ) : (
            // Los códigos son cadenas cortas y todas iguales de largas: una
            // rejilla los deja comparables de un vistazo, mejor que una lista
            // de filas anchas medio vacías.
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10,
            }}>
              {visibles.map(c => {
                const usado = !!c.estado;
                return (
                  <div
                    key={c.id}
                    className="adm-fila"
                    style={{
                      ...carta,
                      padding: "14px 16px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      background: usado ? C.velo : C.superficie,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <code style={{
                        fontSize: 16, fontWeight: 700, letterSpacing: "0.12em",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        color: usado ? C.tenue : C.texto,
                        textDecoration: usado ? "line-through" : "none",
                      }}>
                        {c.codigo}
                      </code>
                      <div style={{ fontSize: T.micro, color: C.tenue, marginTop: 4 }}>
                        {usado ? "Ya canjeado" : "Disponible"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {!usado && (
                        <BotonIcono titulo={copiado === c.id ? "Copiado" : "Copiar código"} onClick={() => handleCopiar(c.id, c.codigo)}>
                          {copiado === c.id ? <Check size={14} color={C.ok} /> : <Copy size={14} />}
                        </BotonIcono>
                      )}
                      <BotonIcono titulo="Eliminar código" tono="peligro" onClick={() => borrado.pedir(c)}>
                        <Trash2 size={14} />
                      </BotonIcono>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
