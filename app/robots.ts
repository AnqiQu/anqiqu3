import type { MetadataRoute } from "next";

const BASE_URL = "https://anqiqu.com";

// Allow every crawler everywhere. The only excluded path is the image
// optimizer endpoint, which serves derivative images and has no standalone
// pages worth indexing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_vinext/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
