import { Suspense } from "react";
import PlanesPage from "@/frontend/src/pages/planes";

export const metadata = {
  title: "Planes - VIVE+",
};

export default function Page() {
  return (
    <Suspense>
      <PlanesPage />
    </Suspense>
  );
}