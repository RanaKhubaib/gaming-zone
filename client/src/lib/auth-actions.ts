import { api } from "./api";
import type { AuthUser } from "./types";

export async function loginAction(formData: FormData) {
  try {
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const data = await api.post<{ user: AuthUser }>("/api/auth/login", {
      username,
      password,
    });
    return { success: true as const, user: data.user };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Login failed" };
  }
}

export async function logoutAction() {
  await api.post("/api/auth/logout", {});
}

export async function updateAccountAction(formData: FormData) {
  try {
    const body = {
      displayName: String(formData.get("displayName") || "").trim(),
      username: String(formData.get("username") || "").trim(),
      currentPassword: String(formData.get("currentPassword") || ""),
      newPassword: String(formData.get("newPassword") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    };
    await api.put("/api/auth/account", body);
    return { success: true as const };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed" };
  }
}
