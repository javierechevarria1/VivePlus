import type { Metadata } from "next";
import { PaginaLegal } from "@/frontend/src/pages/legal";

export const metadata: Metadata = {
  title: "Devoluciones y reembolsos",
  description: "Cómo devolver un pedido de Vive+, cuánto tiempo tienes y cuándo recuperas el dinero.",
};

export default function Page() {
  return <PaginaLegal slug="devoluciones" />;
}
