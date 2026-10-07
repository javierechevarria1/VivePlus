import type { Metadata } from "next";
import { PaginaLegal } from "@/frontend/src/pages/legal";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Las reglas de uso de Vive+: quién puede usarla y cómo funcionan las compras.",
};

export default function Page() {
  return <PaginaLegal slug="terminos" />;
}
