"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function enterDemo() {
  const cookieStore = await cookies();
  cookieStore.set("costpilot_demo_user", "demo-user-00000000-0000-0000-0000-000000000001", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("costpilot_demo_user");
}

