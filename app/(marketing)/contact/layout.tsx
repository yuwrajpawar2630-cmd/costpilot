import type { Metadata } from "next";
import { getMetadata } from "@/lib/seo";

export const metadata: Metadata = getMetadata({
  title: "Contact Us — CostPilot AI",
  description:
    "Have questions or need support with CostPilot AI? Get in touch with our team for general support, billing inquiries, or enterprise partnerships.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
