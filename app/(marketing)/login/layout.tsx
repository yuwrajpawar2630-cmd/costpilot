import type { Metadata } from "next";
import { getMetadata } from "@/lib/seo";

export const metadata: Metadata = getMetadata({
  title: "Sign In — CostPilot AI",
  description:
    "Log in to your CostPilot AI account to upload blueprints, manage your estimates, and update your profile.",
  path: "/login",
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
