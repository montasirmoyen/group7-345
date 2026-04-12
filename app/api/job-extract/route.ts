import { NextResponse } from "next/server";

type ExtractionPayload = {
  companyName: string;
  jobTitle: string;
  location: string;
  salary: string;
  extracted: string[];
};

type JsonRecord = Record<string, unknown>;

const USER_AGENT =
  "Mozilla/5.0 (compatible; JobAppTrackerBot/1.0; +https://example.com/job-app-tracker)";

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(value: string) {
  return compactWhitespace(value.replace(/<[^>]*>/g, " "));
}

function findMetaContent(html: string, attribute: "name" | "property", key: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attribute}=["']${key}["'][^>]*>`,
    "i"
  );

  const match = html.match(pattern) || html.match(reversePattern);
  return match?.[1] ? decodeHtmlEntities(compactWhitespace(match[1])) : "";
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch?.[1]) return "";
  const cleanTitle = decodeHtmlEntities(stripTags(titleMatch[1]));
  return cleanTitle.split(/[|\-–]/).map((part) => part.trim()).find(Boolean) || cleanTitle;
}

function normalizeSalaryText(value: string) {
  const clean = compactWhitespace(value);
  const maxLength = 120;
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
}

function firstString(values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return compactWhitespace(value);
    }
  }
  return "";
}

function asRecord(value: unknown): JsonRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function parseJsonLdScripts(html: string) {
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const records: JsonRecord[] = [];

  for (const script of scripts) {
    const contentMatch = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!contentMatch?.[1]) continue;

    const raw = contentMatch[1].trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const record = asRecord(item);
          if (record) records.push(record);
        }
      } else {
        const record = asRecord(parsed);
        if (record) records.push(record);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return records;
}

function findJobPosting(jsonLdRecords: JsonRecord[]) {
  const queue = [...jsonLdRecords];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const typeValue = current["@type"];
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    if (types.some((value) => typeof value === "string" && value.toLowerCase() === "jobposting")) {
      return current;
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          const record = asRecord(item);
          if (record) queue.push(record);
        }
      } else {
        const record = asRecord(value);
        if (record) queue.push(record);
      }
    }
  }

  return null;
}

function getHostCompanyName(url: URL) {
  const hostname = url.hostname.replace(/^www\./i, "");
  const firstSegment = hostname.split(".")[0] || hostname;
  return firstSegment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function extractSalaryFromText(html: string) {
  const text = stripTags(html);
  const salaryMatch = text.match(
    /(\$\s?\d{2,3}(?:[\d,]{0,6})(?:\s?(?:-|to)\s?\$?\d{2,3}(?:[\d,]{0,6}))?(?:\s?\/?\s?(?:year|yr|hour|hr))?)/i
  );
  return salaryMatch?.[1] ? normalizeSalaryText(salaryMatch[1]) : "";
}

function extractLocationFromText(html: string) {
  const text = stripTags(html);
  const locationMatch = text.match(/(?:location|work location|job location)\s*[:\-]\s*([^|,.\n]{3,80})/i);
  if (locationMatch?.[1]) return compactWhitespace(locationMatch[1]);

  const remoteMatch = text.match(/\b(remote|hybrid|on[-\s]?site)\b/i);
  if (remoteMatch?.[1]) return compactWhitespace(remoteMatch[1]);

  return "";
}

function extractFromJsonLd(jobPosting: JsonRecord) {
  const title = typeof jobPosting.title === "string" ? compactWhitespace(jobPosting.title) : "";

  const hiringOrg = asRecord(jobPosting.hiringOrganization);
  const companyName =
    typeof hiringOrg?.name === "string" ? compactWhitespace(hiringOrg.name) : "";

  const baseSalary = asRecord(jobPosting.baseSalary);
  const salaryValueRecord = asRecord(baseSalary?.value);
  const salary = firstString([
    baseSalary?.["value"],
    salaryValueRecord?.value,
    salaryValueRecord?.minValue,
    salaryValueRecord?.maxValue,
  ]);

  let location = "";
  const locations = Array.isArray(jobPosting.jobLocation)
    ? jobPosting.jobLocation
    : [jobPosting.jobLocation];

  for (const loc of locations) {
    const locRecord = asRecord(loc);
    const address = asRecord(locRecord?.address);
    const candidate = firstString([
      address?.addressLocality,
      address?.addressRegion,
      address?.addressCountry,
      locRecord?.name,
    ]);
    if (candidate) {
      location = candidate;
      break;
    }
  }

  if (!location && typeof jobPosting.jobLocationType === "string") {
    location = compactWhitespace(jobPosting.jobLocationType);
  }

  return {
    companyName,
    jobTitle: title,
    location,
    salary: salary ? normalizeSalaryText(salary) : "",
  };
}

function extractFromHtml(url: URL, html: string): ExtractionPayload {
  const extracted: string[] = [];
  const jsonLdRecords = parseJsonLdScripts(html);
  const jobPosting = findJobPosting(jsonLdRecords);
  const jsonLdData = jobPosting ? extractFromJsonLd(jobPosting) : null;

  const titleFromMeta =
    findMetaContent(html, "property", "og:title") || findMetaContent(html, "name", "twitter:title");
  const siteName = findMetaContent(html, "property", "og:site_name");

  const companyName =
    jsonLdData?.companyName ||
    siteName ||
    getHostCompanyName(url);

  const jobTitle =
    jsonLdData?.jobTitle ||
    titleFromMeta ||
    extractTitle(html);

  const location =
    jsonLdData?.location ||
    findMetaContent(html, "property", "job:location") ||
    extractLocationFromText(html);

  const salary =
    jsonLdData?.salary ||
    findMetaContent(html, "property", "job:salary") ||
    extractSalaryFromText(html);

  if (companyName) extracted.push("companyName");
  if (jobTitle) extracted.push("jobTitle");
  if (location) extracted.push("location");
  if (salary) extracted.push("salary");

  return {
    companyName,
    jobTitle,
    location,
    salary,
    extracted,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return NextResponse.json({ error: "Job description URL is required." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "URL must start with http or https." }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Could not access this job link. Try another public posting URL.",
        },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        {
          error: "This link is not an HTML job posting page.",
        },
        { status: 400 }
      );
    }

    const html = await response.text();
    const result = extractFromHtml(parsedUrl, html);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to extract job details. Please fill the fields manually.",
      },
      { status: 500 }
    );
  }
}
