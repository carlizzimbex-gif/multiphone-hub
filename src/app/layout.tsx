import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MultiPhone Hub — Android device control",
  description: "One workspace to monitor and control multiple Android devices.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}