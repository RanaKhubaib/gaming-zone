export type ApiError = { error: string };

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as ApiError).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  return parse<T>(res);
}

export async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body:
      body == null
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  return parse<T>(res);
}

export const api = {
  get: apiGet,
  post: <T>(path: string, body?: unknown) => apiSend<T>(path, "POST", body),
  put: <T>(path: string, body?: unknown) => apiSend<T>(path, "PUT", body),
  delete: <T>(path: string) => apiSend<T>(path, "DELETE"),
};
