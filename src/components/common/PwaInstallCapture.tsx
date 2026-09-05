"use client";

import { useEffect } from "react";
import { startPwaInstallCapture } from "@/hooks/usePwaInstall";

export default function PwaInstallCapture() {
  useEffect(() => {
    startPwaInstallCapture();
  }, []);

  return null;
}
