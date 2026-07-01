import type { Metadata } from "next";
import { getMetadata } from "@/lib/seo";

export const metadata: Metadata = getMetadata({
  title: "Get Started for Free — CostPilot AI",
  description:
    "Create a free CostPilot AI account today and get 2 free blueprint analyses per month. Start generating professional construction estimates instantly.",
  path: "/signup",
});

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
