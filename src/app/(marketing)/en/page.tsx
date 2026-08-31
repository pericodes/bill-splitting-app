import type { Metadata } from "next";
import LandingPage from "@/landing/LandingPage";
import { en } from "@/landing/content";
import { landingMetadata } from "@/landing/metadata";

export const dynamic = "force-static";
export const metadata: Metadata = landingMetadata(en, "en");

export default function EnglishHomePage() {
  return <LandingPage content={en} />;
}
