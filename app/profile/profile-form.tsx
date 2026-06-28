"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  initialName: string;
  initialCompanyName: string;
  email: string;
  createdAtStr: string;
}

export function ProfileForm({
  initialName,
  initialCompanyName,
  email,
  createdAtStr,
}: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initialName);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password reset fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase is not configured properly.");
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email!,
          name,
          company_name: companyName,
        }, { onConflict: "id" });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.updateUser({
        data: { name, full_name: name }
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setPasswordError("Supabase is not configured properly.");
        setUpdatingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Details Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-md">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Profile Information</h2>
        
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Profile updated successfully!</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 px-4 text-sm text-zinc-500 outline-none cursor-not-allowed"
            />
            <p className="text-xs text-zinc-400">Your email address cannot be changed.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="company" className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Company Name (Optional)
            </label>
            <input
              id="company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Construction"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {createdAtStr && (
            <div className="text-xs text-zinc-400">
              Member since: <span className="font-semibold text-zinc-600">{createdAtStr}</span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="order-2 w-full rounded-xl border border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all duration-200 hover:bg-zinc-50 active:scale-[0.98] sm:order-1 sm:w-auto sm:px-6"
            >
              Go to Dashboard
            </button>
            <button
              type="submit"
              disabled={saving}
              className="order-1 w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-orange-700 hover:shadow-lg disabled:opacity-60 active:scale-[0.98] sm:order-2 sm:w-auto sm:px-6"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-md">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Change Password</h2>

        {passwordError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{passwordError}</span>
            </div>
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Password changed successfully!</span>
            </div>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 pr-12 text-sm outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmNewPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              type={showPassword ? "text" : "password"}
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm outline-none transition-all duration-200 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-orange-700 hover:shadow-lg disabled:opacity-60 active:scale-[0.98] sm:w-auto sm:px-6"
            >
              {updatingPassword ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Updating...</span>
                </div>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
