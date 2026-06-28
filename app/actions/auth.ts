"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email";

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

/**
 * Checks if any custom email provider (Resend, SendGrid, or SMTP) is configured in the environment.
 */
export async function isCustomEmailConfigured(): Promise<boolean> {
  return Boolean(
    process.env.EMAIL_PROVIDER ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY ||
    process.env.SMTP_HOST
  );
}

/**
 * Server action to sign up a user and send a verification email using a custom email provider.
 * Uses the Supabase service role client to generate an email verification link.
 */
export async function signUpWithCustomEmail({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    const supabaseAdmin = await createServiceClient();
    if (!supabaseAdmin) {
      return { error: "Supabase service client could not be initialized. Please check your SUPABASE_SERVICE_ROLE_KEY." };
    }

    // Generate the signup verification link using Supabase Admin Auth
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: "https://costpilotsai.com/auth/callback",
        data: {
          name: name,
          full_name: name,
        },
      },
    });

    // Log the exact response from Supabase
    console.log("Supabase Admin generateLink response:", {
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
      hasLink: !!data?.properties?.action_link,
      error,
    });

    if (error) {
      return { error: error.message };
    }

    const confirmLink = data?.properties?.action_link;
    if (!confirmLink) {
      return { error: "Failed to generate confirmation link from Supabase." };
    }

    // Send the email via custom provider
    const emailResult = await sendVerificationEmail(email, confirmLink);
    if (!emailResult.success) {
      return { error: emailResult.error || "Failed to send verification email via custom provider." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signUpWithCustomEmail server action:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred." };
  }
}

