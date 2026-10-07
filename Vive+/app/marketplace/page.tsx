import { Suspense } from "react";
import MarketplacePage from "@/frontend/src/pages/marketplace";

export default function Page() {
  return (
    <Suspense>
      <MarketplacePage />
    </Suspense>
  );
}
