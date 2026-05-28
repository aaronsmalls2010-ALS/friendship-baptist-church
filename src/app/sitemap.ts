import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thefriendshipbaptist.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    "",
    "/about",
    "/history",
    "/pastor",
    "/ministries",
    "/deacons",
    "/events",
    "/calendar",
    "/media",
    "/give",
    "/prayer",
    "/contact",
    "/welcome",
    "/business-directory",
    "/trivia",
    "/loved-ones",
  ];

  return publicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date("2026-05-28"),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
