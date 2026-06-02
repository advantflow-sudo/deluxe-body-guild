import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface Ctx {
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  toggle: () => void;
  source: "user" | "system" | "default";
}

const ReduceMotionContext = createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = "deluxe:reduce-motion";

export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [source, setSource] = useState<"user" | "system" | "default">("default");

  // Initialize from localStorage or system preference.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1" || stored === "0") {
      setReduceMotionState(stored === "1");
      setSource("user");
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotionState(mq.matches);
    setSource(mq.matches ? "system" : "default");
    const onChange = (e: MediaQueryListEvent) => {
      if (window.localStorage.getItem(STORAGE_KEY) !== null) return;
      setReduceMotionState(e.matches);
      setSource(e.matches ? "system" : "default");
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Reflect on <html> for CSS scoping (`html[data-reduce-motion="true"] .ken-burns { animation: none }` etc.)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false";
  }, [reduceMotion]);

  const setReduceMotion = useCallback((v: boolean) => {
    setReduceMotionState(v);
    setSource("user");
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => setReduceMotion(!reduceMotion), [reduceMotion, setReduceMotion]);

  return (
    <ReduceMotionContext.Provider value={{ reduceMotion, setReduceMotion, toggle, source }}>
      {children}
    </ReduceMotionContext.Provider>
  );
}

export function useReduceMotion(): Ctx {
  const ctx = useContext(ReduceMotionContext);
  if (!ctx) {
    // Safe default for SSR / outside provider.
    return {
      reduceMotion: false,
      setReduceMotion: () => {},
      toggle: () => {},
      source: "default",
    };
  }
  return ctx;
}
