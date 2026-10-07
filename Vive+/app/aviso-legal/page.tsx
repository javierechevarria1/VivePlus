import type { Metadata } from "next";
import { PaginaLegal } from "@/frontend/src/pages/legal";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Titular de Vive+, propiedad intelectual, responsabilidad y ley aplicable.",
};

export default function Page() {
  return <PaginaLegal slug="aviso-legal" />;
}
