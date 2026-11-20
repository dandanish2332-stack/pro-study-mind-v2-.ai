export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeJsonFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeJsonResult<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    let parsed: any = null;
    if (text && (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("["))) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error:
          res.status >= 400
            ? `Server returned HTTP ${res.status} (non-JSON response)`
            : "Server returned an unexpected non-JSON response. Please retry.",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: parsed,
        error: parsed?.error || parsed?.message || `Request failed with HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsed as T,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network connection error",
    };
  }
}
