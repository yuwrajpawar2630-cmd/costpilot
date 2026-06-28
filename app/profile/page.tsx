import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingHeader, MarketingFooter } from "@/components/marketing/header-footer";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const initialName = profile?.name || "";
  const initialCompanyName = profile?.company_name || "";
  const createdAtStr = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MarketingHeader />
      
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Your Profile</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage your account information and preferences.</p>
          </div>

          <ProfileForm
            initialName={initialName}
            initialCompanyName={initialCompanyName}
            email={user.email || ""}
            createdAtStr={createdAtStr}
          />
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
