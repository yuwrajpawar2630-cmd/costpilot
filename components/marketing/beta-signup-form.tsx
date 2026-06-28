"use client";

import { useState } from "react";

export function BetaSignupForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/beta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        company_name: formData.get("company_name"),
        role: formData.get("role"),
      }),
    });

    if (res.ok) {
      setStatus("success");
      setMessage("You're on the beta list! We'll email you when your spot opens.");
      e.currentTarget.reset();
    } else {
      setStatus("error");
      setMessage("Signup failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Company</label>
        <input
          name="company_name"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Role</label>
        <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="contractor">General contractor</option>
          <option value="estimator">Estimator</option>
          <option value="builder">Builder</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Join beta waitlist"}
      </button>
      {message && (
        <p
          className={`text-sm ${status === "success" ? "text-green-700" : "text-red-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
