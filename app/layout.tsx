import type { Metadata } from "next";
import { Sidebar } from "@/shared/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Post Web",
  description: "Self-hosted social media scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </body>
    </html>
  );
}
