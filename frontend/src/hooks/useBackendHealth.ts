import { useState, useEffect, useCallback } from "react";

export function useBackendHealth(intervalMs: number = 7000) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("/api/health", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, intervalMs);
    return () => clearInterval(timer);
  }, [checkHealth, intervalMs]);

  return { isOnline, checkHealth, lastChecked };
}
