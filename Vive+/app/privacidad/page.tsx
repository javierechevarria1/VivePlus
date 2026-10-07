import type { Metadata } from "next";
import { PaginaLegal } from "@/frontend/src/pages/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guardamos en Vive+, para qué, con quién se comparten y cómo pedir que los borremos.",
};

export default function Page() {
  return <PaginaLegal slug="privacidad" />;
}
