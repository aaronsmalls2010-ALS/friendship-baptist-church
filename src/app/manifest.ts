import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Friendship Baptist Church",
    short_name: "FBC",
    description:
      "The Friendship Baptist Church — The Church That Christ Built. Beaufort, SC.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9FB",
    theme_color: "#4A1A8A",
    icons: [
      {
        src: "/images/logos/fbc-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logos/fbc-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
