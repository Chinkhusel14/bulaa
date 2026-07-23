import type { Metadata } from "next";
import { DesignSystemView } from "./design-system-view";

export const metadata: Metadata = {
  title: "Design System · Bulaa",
  description: "Temporary Clutch token and component reference",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemView />;
}
