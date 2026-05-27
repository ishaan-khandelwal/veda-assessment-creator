import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VedaAI - AI Assessment Creator",
  description: "Generate intelligent, structured exam papers instantly with AI. Built for teachers who value quality.",
  keywords: ["AI", "assessment", "exam creator", "question paper", "teacher tools"],
  authors: [{ name: "VedaAI" }],
  openGraph: {
    title: "VedaAI - AI Assessment Creator",
    description: "Generate structured exam papers instantly with AI.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
