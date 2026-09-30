"use client";

import { useEffect } from "react";
import Link from "next/link";
import PlanGate from "@/frontend/src/components/plan-gate";
import { usePlan } from "@/frontend/src/components/usePlan";

import { COMUNIDAD_STYLES } from "../components/comunidad/styles";
import { type CurrentUser, type SolicitudesIniciales } from "../components/comunidad/helpers";
import { MiniMap } from "../components/comunidad/MiniMap";
import { ComunidadSidebar } from "../components/comunidad/ComunidadSidebar";
import { ComunidadChatMain } from "../components/comunidad/ComunidadChatMain";
import { useCurrentUser, useComunidadData, useVoiceRecorder } from "../components/comunidad/hooks";

// Re-exportados por compatibilidad (app/comunidad/page.tsx los importa desde aquí).
export type { CurrentUser, Solicitud, SolicitudesIniciales } from "../components/comunidad/helpers";

const CM_MAPA_OVERLAY: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(10px, 4vw, 30px)" };
const CM_MAPA_INNER: React.CSSProperties = { width: "100%", maxWidth: 750, height: "100%", maxHeight: "80vh", background: "white", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };

export default function ComunidadPage({ initialUser = null, initialSolicitudes = { recibidas: [], amigos: [], enviadas: [] } }: { initialUser?: CurrentUser | null; initialSolicitudes?: SolicitudesIniciales }) {
  const { hasPlan, ready } = usePlan();
  const currentUser = useCurrentUser(initialUser);
  const {
    people, selected, input, setInput, search, setSearch, showProfile, setShowProfile,
    range, setRange, loadingChat, chatError, setChatError, loadingUsers, locError,
    zonaNombre, showMobileSidebar, filtroVista, setFiltroVista,
    mapaMax, setMapaMax, solicitudesRecibidas, amigos, enviandoSolicitud,
    messagesAreaRef, filtered, getPersonaEstado, enviarSolicitud, aceptarSolicitud,
    rechazarSolicitud, selectPerson, goBackToList, eliminarAmigo, sendMessage,
    retryLocation, currentPerson,
  } = useComunidadData(currentUser, initialSolicitudes);
  const { isRecording, audioDuration, previewUrl, startRecording, cancelRecording, sendRecording, confirmSend } = useVoiceRecorder(currentUser, selected);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  if (ready && !hasPlan) return <PlanGate />;

  return (
    <>
      <style>{COMUNIDAD_STYLES}</style>

      <div className="chat-wrap">

        <ComunidadSidebar
          showMobileSidebar={showMobileSidebar}
          people={people}
          filtered={filtered}
          range={range}
          setRange={setRange}
          zonaNombre={zonaNombre}
          onOpenMaxMap={() => setMapaMax(true)}
          onSelectPerson={p => selectPerson(p, cancelRecording)}
          search={search}
          setSearch={setSearch}
          filtroVista={filtroVista}
          setFiltroVista={setFiltroVista}
          solicitudesRecibidas={solicitudesRecibidas}
          aceptarSolicitud={aceptarSolicitud}
          rechazarSolicitud={rechazarSolicitud}
          locError={locError}
          loadingUsers={loadingUsers}
          onRetryLocation={retryLocation}
          selected={selected}
          getPersonaEstado={getPersonaEstado}
          enviarSolicitud={enviarSolicitud}
          enviandoSolicitud={enviandoSolicitud}
        />

        <ComunidadChatMain
          // Cambiar de conversacion monta un panel nuevo, con lo que la
          // busqueda arranca vacia sola: antes la limpiaba un efecto, que se
          // ejecuta despues de pintar y dejaba ver un instante lo de la
          // conversacion anterior.
          key={currentPerson?.id ?? "sin-chat"}
          showMobileSidebar={showMobileSidebar}
          currentPerson={currentPerson}
          goBackToList={goBackToList}
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          messagesAreaRef={messagesAreaRef}
          loadingChat={loadingChat}
          chatError={chatError}
          setChatError={setChatError}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isRecording={isRecording}
          audioDuration={audioDuration}
          cancelRecording={cancelRecording}
          sendRecording={sendRecording}
          previewUrl={previewUrl}
          confirmSend={confirmSend}
          startRecording={startRecording}
          eliminarAmigo={eliminarAmigo}
        />
      </div>

      <div style={{ padding: "14px 24px 24px" }}>
        <Link
          href="/"
          style={{
            color: "#EC4899",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 13.5,
            opacity: 0.75,
          }}
        >
          Volver al inicio
        </Link>
      </div>

      {mapaMax && (
        <div style={CM_MAPA_OVERLAY}>
          <div style={CM_MAPA_INNER}>
            <MiniMap
              people={people}
              range={range}
              zonaNombre={zonaNombre}
              isMax={true}
              onToggleMax={() => setMapaMax(false)}
              onSelect={p => { setMapaMax(false); selectPerson(p, cancelRecording); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
