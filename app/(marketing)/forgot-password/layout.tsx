import type { Metadata } from "next";
import { getMetadata } from "@/lib/seo";

export const metadata: Metadata = getMetadata({
  title: "Reset Password — CostPilot AI",
  description:
    "Forgot your password? Enter your email address to receive a secure link to reset your CostPilot AI account password.",
  path: "/forgot-password",
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
