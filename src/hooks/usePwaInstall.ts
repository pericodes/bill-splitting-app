"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let captureStarted = false;
let serviceWorkerPromise: Promise<void> | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function isStandaloneDisplay(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  return window.matchMedia(
    "(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)",
  ).matches;
}

function takeDeferredPrompt() {
  const promptEvent = deferredPrompt ?? window.__pwaDeferredPrompt ?? null;
  deferredPrompt = null;
  if (typeof window !== "undefined") window.__pwaDeferredPrompt = null;
  return promptEvent;
}

function registerPwaServiceWorker() {
  if (serviceWorkerPromise) return serviceWorkerPromise;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    serviceWorkerPromise = Promise.resolve();
    return serviceWorkerPromise;
  }

  serviceWorkerPromise = navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => undefined)
    .catch(() => undefined);

  return serviceWorkerPromise;
}

export function startPwaInstallCapture() {
  if (captureStarted || typeof window === "undefined") return;
  captureStarted = true;

  if (isStandaloneDisplay()) {
    installed = true;
  }

  deferredPrompt = window.__pwaDeferredPrompt ?? deferredPrompt;

  window.matchMedia("(display-mode: standalone)").addEventListener("change", (event) => {
    if (!event.matches) return;
    installed = true;
    deferredPrompt = null;
    window.__pwaDeferredPrompt = null;
    notify();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.__pwaDeferredPrompt = deferredPrompt;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.__pwaDeferredPrompt = null;
    installed = true;
    notify();
  });

  void registerPwaServiceWorker();
}

export function usePwaInstall() {
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    startPwaInstallCapture();
    const sync = () => {
      setCanShow(!installed && !isStandaloneDisplay());
    };
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const promptNativeInstall = useCallback(() => {
    const promptEvent = takeDeferredPrompt();
    if (!promptEvent) return Promise.resolve(false);

    return promptEvent
      .prompt()
      .then(() => promptEvent.userChoice)
      .then(({ outcome }) => {
        if (outcome === "accepted") installed = true;
        notify();
        return true;
      })
      .catch(() => false);
  }, []);

  return { canShow, promptNativeInstall };
}
