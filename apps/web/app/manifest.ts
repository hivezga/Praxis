import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Praxis — Hegemony companion tracker",
    short_name: "Praxis",
    description:
      "Companion tracker for the Hegemony board game. Resources, taxes, payments, population and policies.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0c1019",
    theme_color: "#0c1019",
    categories: ["games", "utilities"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        // `purpose: "any"` until we ship a properly safe-zone-padded
        // maskable variant — masking will currently crop the artwork.
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
