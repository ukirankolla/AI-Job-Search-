import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Noventra — AI Job Search Copilot",
    short_name: "Noventra",
    description:
      "Upload your resume once. Noventra finds matching jobs, shows your match %, and rewrites an ATS-friendly resume and cover letter.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    categories: ["productivity", "career"],
    icons: [
      { src: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
