import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WritWay",
  description: "Multi-tenant SaaS platform for paralegals and small legal practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">WritWay</h1>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t">
            <div className="container mx-auto px-4 py-4">
              <p className="text-center text-muted-foreground">
                © 2024 WritWay. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}