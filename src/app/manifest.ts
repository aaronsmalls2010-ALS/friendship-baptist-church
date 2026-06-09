import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Friendship Baptist Church",
    short_name: "Friendship Baptist",
    description:
      "A faith-filled community in Beaufort, SC. Worship, fellowship, and spiritual growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#13111A",
    theme_color: "#13111A",
    orientation: "portrait-primary",
    categories: ["religion", "lifestyle"],
    icons: [
      {
        src: "/images/logos/fbc-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logos/fbc-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logos/fbc-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
