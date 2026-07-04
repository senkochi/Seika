import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addNotification } from "../store/notificationSlice";
import { baseURL } from "../api/client";

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;

export function useNotificationSSE() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) {
      // If there's no token, abort any existing connection and stop.
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      return;
    }

    // Create a single AbortController for the lifetime of this effect.
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const connectWithRetry = async () => {
      let retryDelay = INITIAL_RETRY_DELAY_MS;

      while (!abortController.signal.aborted) {
        try {
          const response = await fetch(`${baseURL}/notifications/stream`, {
            headers: {
              Authorization: `Bearer ${token}`,
              // Tell the server we accept an SSE stream
              Accept: "text/event-stream",
            },
            signal: abortController.signal,
          });

          if (!response.ok || !response.body) {
            console.warn(
              `[SSE] Connection failed (status ${response.status}), retrying in ${retryDelay}ms…`,
            );
            await sleep(retryDelay, abortController.signal);
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
            continue;
          }

          // Connection established — reset backoff
          retryDelay = INITIAL_RETRY_DELAY_MS;
          console.log("[SSE] Connected to notification stream.");

          // Read the SSE stream line-by-line
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            // SSE events are separated by double newlines
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              // Skip heartbeat comments (": ping" or empty)
              if (part.startsWith(":")) continue;

              // Parse data lines within the event block
              for (const line of part.split("\n")) {
                if (!line.startsWith("data:")) continue;

                const dataStr = line.slice("data:".length).trim();
                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  if (data && data.id) {
                    dispatch(addNotification(data));
                  }
                } catch {
                  // Non-JSON data (e.g. CONNECTED message) — safe to ignore
                  console.debug("[SSE] Non-JSON data:", dataStr);
                }
              }
            }
          }

          // Stream ended normally — reconnect immediately (server may have
          // closed the connection due to its own timeout).
          console.log("[SSE] Stream ended, reconnecting…");
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            (err.name === "AbortError" || abortController.signal.aborted)
          ) {
            // Intentional abort (e.g. component unmount / logout) — stop.
            return;
          }
          console.warn(`[SSE] Error, retrying in ${retryDelay}ms…`, err);
          await sleep(retryDelay, abortController.signal);
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
        }
      }
    };

    connectWithRetry();

    return () => {
      console.log("[SSE] Disconnecting notification stream.");
      abortController.abort();
    };
  }, [token, dispatch]);
}

/** Await a delay that is cancellable via an AbortSignal. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
