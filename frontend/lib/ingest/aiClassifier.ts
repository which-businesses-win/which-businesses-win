import OpenAI from "openai";

import type { SignalCategory } from "@/lib/signals/types";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export type Classification = {
  category: SignalCategory;
  sentiment: number;
  strength: number;
  sectors: string[];
  /** Model output — passed through `normalizeLocationForStorage` on persist. */
  location: { name: string; type: string };
  summary: string;
};

const CATEGORIES: SignalCategory[] = [
  "planning",
  "capital",
  "demand",
  "regulation",
  "delivery",
];

function extractJson(text: string): string {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return t;
}

function isCategory(s: string): s is SignalCategory {
  return (CATEGORIES as string[]).includes(s);
}

function parseClassification(text: string): Classification {
  const raw = extractJson(text);
  const o = JSON.parse(raw) as Record<string, unknown>;

  const categoryRaw =
    typeof o.category === "string" ? o.category.trim() : "";
  const category = isCategory(categoryRaw) ? categoryRaw : null;
  const sentiment = Number(o.sentiment);
  const strength = Number(o.strength);
  const summary =
    typeof o.summary === "string" ? o.summary.trim() : "";
  const sectors = Array.isArray(o.sectors)
    ? o.sectors.filter((x): x is string => typeof x === "string")
    : [];

  let locationName = "UK";
  let locationType = "national";
  const locRaw = o.location;
  if (locRaw && typeof locRaw === "object" && !Array.isArray(locRaw)) {
    const L = locRaw as Record<string, unknown>;
    const n = typeof L.name === "string" ? L.name.trim() : "";
    const t = typeof L.type === "string" ? L.type.trim() : "";
    if (
      n &&
      (t === "city" || t === "region" || t === "national")
    ) {
      locationName = n;
      locationType = t;
    }
  }

  if (!category) throw new Error("invalid_category");
  if (!Number.isFinite(sentiment) || sentiment < -1 || sentiment > 1) {
    throw new Error("invalid_sentiment");
  }
  if (!Number.isFinite(strength) || strength < 1 || strength > 100) {
    throw new Error("invalid_strength");
  }

  return {
    category,
    sentiment,
    strength,
    sectors,
    location: { name: locationName, type: locationType },
    summary,
  };
}

const PROMPT = `Classify this UK property/development article.

Return JSON only with keys: category, sentiment, strength, sectors, location, summary.

Rules:
- category: one of planning | capital | demand | regulation | delivery
- sentiment: number from -1 to 1
- strength: integer 1 to 100 (how actionable / material for UK real estate investors)
- sectors: array of slugs — use any of: btr, build-to-rent, housebuilders, uk-housebuilders, retail, high-street-retail, batteries, grid-batteries, energy, small-landlords, landlords, industrial — only include sectors clearly relevant; empty array if none.
- location: object with "name" (city name, or UK if national / no specific city) and "type" (city | region | national)
- summary: max 20 words, UK-focused

Article:
"""`;

/**
 * Single controlled “smart” step: messy text → structured signal fields.
 */
export async function classifyArticle(content: string): Promise<Classification> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: key });
  const user = `${PROMPT}${content.replace(/"""/g, "'")}"""`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a UK real estate analyst. Reply with a single JSON object only, no prose.",
      },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 500,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("empty_model_response");
  return parseClassification(text);
}
