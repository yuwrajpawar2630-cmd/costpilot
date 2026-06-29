import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export async function MarketingHeader() {
  const supabase = await createClient();
  let user = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await logout(); // clears the demo cookie
    redirect("/");
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-orange-600">
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
          <Link href="/how-it-works" className="hover:text-zinc-900">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-zinc-900">
            Pricing
          </Link>
          <Link href="/beta" className="hover:text-zinc-900">
            Beta
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Profile
              </Link>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Try free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:justify-between">
        <div>
          <p className="font-bold text-orange-600">{APP_NAME}</p>
          <p className="mt-1 text-sm text-zinc-500">
            AI construction estimating — not project management.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-zinc-600">
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/sample-report">Sample report</Link>
        </div>
      </div>
    </footer>
  );
}
