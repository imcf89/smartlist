import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartList — Grocery savings, sorted",
  description: "Compare local Winn-Dixie and ALDI prices, package sizes, and weekly deals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
