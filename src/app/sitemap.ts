import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thefriendshipbaptist.com";

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
  ];

  return publicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
