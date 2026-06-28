"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { logout } from "@/app/actions/auth";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/estimates", label: "Estimates" },
  { href: "/dashboard/estimates/new", label: "New estimate" },
];

export function DashboardNav() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
      await logout();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Failed to log out", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-full border-b border-zinc-200 bg-white md:w-56 md:border-b-0 md:border-r md:min-h-screen flex flex-col justify-between">
      <div>
        <div className="px-4 py-5">
          <Link href="/dashboard" className="text-lg font-bold text-orange-600">
            {APP_NAME}
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-4 md:flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="px-2 pb-4 md:pb-6">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition duration-150 disabled:opacity-60 cursor-pointer"
        >
          {loggingOut ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

