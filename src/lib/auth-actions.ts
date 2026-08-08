"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return { error: "Invalid username or password." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid username or password." };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
  });

  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function updateAccountAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "You must be logged in." };

  const displayName = String(formData.get("displayName") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!displayName) return { error: "Display name is required." };
  if (!username) return { error: "Username is required." };
  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User not found." };

  const changingPassword = Boolean(newPassword || confirmPassword);
  if (changingPassword) {
    if (!currentPassword) {
      return { error: "Enter your current password to set a new one." };
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect." };
    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "New password and confirmation do not match." };
    }
  } else if (username !== user.username) {
    if (!currentPassword) {
      return { error: "Enter your current password to change username." };
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return { error: "Current password is incorrect." };
  }

  const conflict = await prisma.user.findFirst({
    where: { username, NOT: { id: user.id } },
  });
  if (conflict) return { error: "That username is already taken." };

  const data: {
    displayName: string;
    username: string;
    passwordHash?: string;
  } = { displayName, username };

  if (changingPassword) {
    data.passwordHash = await hashPassword(newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  await createSession({
    userId: updated.id,
    username: updated.username,
    displayName: updated.displayName,
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}
