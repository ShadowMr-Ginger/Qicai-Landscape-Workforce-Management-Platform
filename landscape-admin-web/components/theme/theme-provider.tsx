"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const init = useThemeStore((s) => s.init);
  const syncSystem = useThemeStore((s) => s.syncSystem);

  useEffect(() => {
    init();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => syncSystem();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [init, syncSystem]);

  return <>{children}</>;
}
