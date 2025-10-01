import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/Header";
import { MarketingFooter } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: {
    default: "WritWay",
    template: "%s | WritWay",
  },
  description: "WritWay public pages",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <div className="container py-16">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}


