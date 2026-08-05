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
  title: "Noventra — Upload Your Resume, We Match & Apply",
  description:
    "Noventra scans fresh job postings, matches each one to your resume with a clear match score, rewrites an ATS-friendly resume and cover letter for you, and opens the official application page — so you just apply.",
  keywords: [
    "noventra",
    "ai job search",
    "ai job matching",
    "resume matching",
    "match percentage resume",
    "ats friendly resume",
    "auto apply jobs",
    "tailored cover letter",
    "interview prep",
  ],
  openGraph: {
    title: "Noventra — Upload Your Resume, We Match & Apply",
    description:
      "Upload your resume once. Noventra finds matching jobs, shows your match %, rewrites your ATS-friendly resume, and gets you to the official application.",
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
