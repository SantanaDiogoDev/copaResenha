import { useCallback, useEffect, useRef, useState } from "react";

// Intervalo de atualização automática
export const REFRESH_MS = 30_000;

export function useSheet() {
  const [state, setState] = useState({ sheets: null, error: null, loading: true, updatedAt: null });
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/planilha?t=${Date.now()}`);
      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      if (!isJson) throw new Error("A API não respondeu. Rodando localmente? Use “npm run dev” (Netlify CLI).");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erro ${res.status} ao ler a planilha.`);
      setState({ sheets: json.sheets, error: null, loading: false, updatedAt: new Date() });
    } catch (err) {
      // Mantém os últimos dados válidos na tela
      setState((s) => ({ ...s, error: err.message, loading: false }));
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => !document.hidden && load(), REFRESH_MS);
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { ...state, reload: load };
}
