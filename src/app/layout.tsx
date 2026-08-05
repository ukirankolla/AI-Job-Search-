import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "AI Job Search — Auto-Match, Tailor & Apply to Jobs",
  description:
    "Upload your resume once and let AI agents match fresh job postings, close your skill gaps, rewrite your resume and cover letter, and prep you for interviews. Free job matching, tailored applications in one click.",
  keywords: [
    "ai job search",
    "ai job matching",
    "resume matching",
    "auto apply jobs",
    "tailored cover letter",
    "interview prep",
  ],
  openGraph: {
    title: "AI Job Search — Auto-Match, Tailor & Apply to Jobs",
    description:
      "Upload your resume once. AI finds matching jobs, closes skill gaps, and tailors your application.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
