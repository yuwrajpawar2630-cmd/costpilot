import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Auto-provision profile on successful code exchange
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email!,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              created_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else {
          // Sanitization: Ensure we do not redirect to localhost, 127.0.0.1, or 0.0.0.0 in production
          const isLocalhost = (host: string) => {
            const h = host.toLowerCase();
            return h.includes("localhost") || h.includes("127.0.0.1") || h.includes("0.0.0.0");
          };

          let targetOrigin = "https://costpilotsai.com";

          if (forwardedHost && !isLocalhost(forwardedHost)) {
            targetOrigin = `https://${forwardedHost}`;
          } else if (origin && !isLocalhost(origin)) {
            targetOrigin = origin;
          }

          console.log(`Production Auth Callback redirecting to: ${targetOrigin}${next}`);
          return NextResponse.redirect(`${targetOrigin}${next}`);
        }
      }
    }
  }

  // If there's an error, redirect to login page with a query error parameter
  return NextResponse.redirect(
    `${origin}/login?error=Could not exchange authentication token. Please try again.`
  );
}
