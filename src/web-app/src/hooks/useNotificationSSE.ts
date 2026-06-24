import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addNotification } from "../store/notificationSlice";

export function useNotificationSSE() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    // Connect to SSE using EventSource
    // Note: Standard EventSource doesn't support custom headers like Authorization.
    // However, if we use a polyfill or fetch-based approach, we can.
    // For standard EventSource, we might need to pass the token as a query parameter or use a polyfill like @microsoft/fetch-event-source.
    // Here we use standard EventSource assuming API gateway or backend handles cookie or we pass token in URL.
    // Since we only have token in header, a common workaround is passing it via query param if the backend supports it.
    // Let's assume the backend will read token from query parameter `?token=...` if Authorization header is missing.
    // Or, we use standard EventSource and rely on cookies. Wait, our API uses JWT in headers.
    // To keep it simple and dependency-free, let's use a manual fetch-based stream reader, OR just pass the token.
    // Actually, passing token in query string is the standard workaround for EventSource.
    // Our backend expects `X-User-Id` header. Oh! The backend expects `X-User-Id` header which is injected by API Gateway from the JWT.
    // But API Gateway needs the JWT to validate and extract `X-User-Id`.
    // We must pass the token as a query parameter `?access_token=${token}` and API Gateway should handle it,
    // OR we can fetch it. Let's use the standard `EventSource` with query parameter:

    // Better yet, we can use standard fetch API to consume SSE to keep headers.
    const abortController = new AbortController();

    const connectSSE = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/notifications/stream`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          },
        );

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const dataStr = line.replace("data:", "").trim();
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data && data.id) {
                    dispatch(addNotification(data));
                  }
                } catch (e) {
                  console.log("SSE Message:", dataStr);
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("SSE fetch error:", err);
        }
      }
    };

    connectSSE();

    return () => {
      abortController.abort();
    };
  }, [token, dispatch]);
}
