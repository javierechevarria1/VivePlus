// Spinner de carga (extraído de comunidad.tsx).
export function Spinner({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ width: 20, height: 20, border: "2px solid #EDE9FE", borderTopColor: "#EC4899", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
      <p style={{ color: "#94A3B8", fontSize: 13 }}>{label}</p>
    </div>
  );
}
