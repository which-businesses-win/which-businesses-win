import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanSureAI — Market Intelligence for Development Finance",
  description:
    "Live intelligence for UK development deals: capital flows, planning risk, IRR bridge, investment memos. Built for lenders, investors, and developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <footer className="mt-auto mt-12 px-4 py-6 text-center text-xs text-deal-muted/50">
          {
            "This information is provided for general informational purposes only and does not constitute financial, investment, or development advice. You should seek independent professional advice before making any decisions."
          }
        </footer>
      </body>
    </html>
  );
}
