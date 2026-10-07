import type { Metadata } from "next";
import { PaginaLegal } from "@/frontend/src/pages/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies usa Vive+, para qué sirven y cómo cambiar tu elección.",
};

export default function Page() {
  return <PaginaLegal slug="cookies" />;
}
