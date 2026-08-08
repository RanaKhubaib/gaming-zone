import { api } from "./api";

type ActionResult = {
  error?: string;
  success?: boolean;
  [key: string]: unknown;
};

function bodyFromForm(formData: FormData) {
  const body: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") body[key] = value;
  });
  return body;
}

async function wrap(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    const data = (await fn()) as ActionResult;
    return data ?? { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed" };
  }
}

export async function updateAppSettings(formData: FormData) {
  const body = bodyFromForm(formData);
  body.liveTimerEnabled = formData.get("liveTimerEnabled") === "on";
  body.showLiveRunningCost = formData.get("showLiveRunningCost") === "on";
  body.roundUpToFullHours = formData.get("roundUpToFullHours") === "on";
  return wrap(() => api.put("/api/settings", body));
}

export async function uploadLogo(formData: FormData) {
  return wrap(() => api.post("/api/settings/logo", formData));
}

export async function removeLogo() {
  return wrap(() => api.delete("/api/settings/logo"));
}

export async function createStation(formData: FormData) {
  return wrap(() => api.post("/api/stations", bodyFromForm(formData)));
}
export async function updateStation(formData: FormData) {
  return wrap(() => api.put("/api/stations", bodyFromForm(formData)));
}
export async function deleteStation(id: number) {
  return wrap(() => api.delete(`/api/stations/${id}`));
}

export async function createGame(formData: FormData) {
  return wrap(() => api.post("/api/games", bodyFromForm(formData)));
}
export async function updateGame(formData: FormData) {
  return wrap(() => api.put("/api/games", bodyFromForm(formData)));
}
export async function deleteGame(id: number) {
  return wrap(() => api.delete(`/api/games/${id}`));
}

export async function createManualSession(formData: FormData) {
  return wrap(() => api.post("/api/sessions/manual", bodyFromForm(formData)));
}
export async function startTimerSession(formData: FormData) {
  return wrap(() => api.post("/api/sessions/timer/start", bodyFromForm(formData)));
}
export async function extendTimerHour(sessionId: number) {
  return wrap(() => api.post(`/api/sessions/${sessionId}/extend`, {}));
}
export async function stopTimerSession(
  sessionId: number,
  options?: { ignoreOvertime?: boolean }
) {
  return wrap(() =>
    api.post(`/api/sessions/${sessionId}/stop`, options ?? {})
  );
}
export async function updateSession(formData: FormData) {
  return wrap(() => api.put("/api/sessions", bodyFromForm(formData)));
}
export async function markSessionPaid(id: number) {
  return wrap(() => api.post(`/api/sessions/${id}/paid`, {}));
}
export async function deleteSession(id: number) {
  return wrap(() => api.delete(`/api/sessions/${id}`));
}
export async function importSessionsCsvAction(formData: FormData) {
  return wrap(() => api.post("/api/sessions/import", formData));
}

export async function createSubscriber(formData: FormData) {
  return wrap(() => api.post("/api/subscribers", bodyFromForm(formData)));
}
export async function updateSubscriber(formData: FormData) {
  return wrap(() => api.put("/api/subscribers", bodyFromForm(formData)));
}
export async function deleteSubscriber(id: number) {
  return wrap(() => api.delete(`/api/subscribers/${id}`));
}
