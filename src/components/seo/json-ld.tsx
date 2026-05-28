import Script from "next/script";

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="beforeInteractive"
    />
  );
}

// Pre-built schemas for common use
export const churchSchema = {
  "@context": "https://schema.org",
  "@type": "Church",
  "name": "The Friendship Baptist Church",
  "alternateName": "FBC",
  "url": "https://www.thefriendshipbaptist.com",
  "description": "A faith-filled community in Beaufort, SC rooted in love, worship, and the Lowcountry Gullah Geechee tradition.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Beaufort",
    "addressRegion": "SC",
    "addressCountry": "US",
  },
  "telephone": "",
  "founder": {
    "@type": "Person",
    "name": "Pastor Isiah Smalls",
    "jobTitle": "Pastor",
  },
  "event": [
    {
      "@type": "Event",
      "name": "Sunday Morning Worship",
      "startDate": "2026-06-01T10:00:00-04:00",
      "eventSchedule": {
        "@type": "Schedule",
        "byDay": "https://schema.org/Sunday",
        "startTime": "10:00",
        "endTime": "12:00",
        "scheduleTimezone": "America/New_York",
      },
      "location": {
        "@type": "Place",
        "name": "The Friendship Baptist Church",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Beaufort",
          "addressRegion": "SC",
        },
      },
    },
    {
      "@type": "Event",
      "name": "Sunday School",
      "startDate": "2026-06-01T09:00:00-04:00",
      "eventSchedule": {
        "@type": "Schedule",
        "byDay": "https://schema.org/Sunday",
        "startTime": "09:00",
        "endTime": "09:45",
        "scheduleTimezone": "America/New_York",
      },
    },
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "The Friendship Baptist Church",
  "url": "https://www.thefriendshipbaptist.com",
};
