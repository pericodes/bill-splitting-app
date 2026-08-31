import type { Metadata } from "next";
import LandingPage from "@/landing/LandingPage";
import { es } from "@/landing/content";
import { landingMetadata } from "@/landing/metadata";

export const dynamic = "force-static";
export const metadata: Metadata = landingMetadata(es, "es");

export default function HomePage() {
  return <LandingPage content={es} />;
}
