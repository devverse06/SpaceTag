import { GoogleGenerativeAI } from "@google/generative-ai";
import { isSpaceAnnotations, type SpaceAnnotations } from "./types";

const GEMINI_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 3;

// Current live models as of June 2026 (2.0 and 1.x are all shut down)
const MODEL_PRIORITY = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

const DEMO_ANNOTATIONS: SpaceAnnotations = {
  roomType: "Living Room",
  furniture: ["Sofa", "Coffee table", "Floor lamp", "Bookshelf"],
  materials: ["Hardwood flooring", "Linen upholstery", "Brass accents"],
  lightingStyle: "Warm ambient with natural daylight",
  colorPalette: ["Warm beige", "Soft white", "Muted sage", "Walnut brown"],
};

const ANALYSIS_PROMPT = `Analyze this interior space image. Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "roomType": "string - e.g. Living Room, Kitchen, Bedroom",
  "furniture": ["array of furniture items visible"],
  "materials": ["array of materials and finishes visible"],
  "lightingStyle": "string describing the lighting",
  "colorPalette": ["array of dominant colors as descriptive names"]
}`;

function parseAnnotations(text: string): SpaceAnnotations {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed: unknown = JSON.parse(cleaned);
  if (!isSpaceAnnotations(parsed)) {
    throw new Error("Gemini returned an invalid annotation shape");
  }
  return parsed;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Gemini request timed out")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("too many requests")
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  imageBase64: string,
  mimeType: string,
): Promise<SpaceAnnotations> {
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await withTimeout(
    model.generateContent([
      ANALYSIS_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]),
    GEMINI_TIMEOUT_MS,
  );

  const text = result.response.text();
  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response");
  }

  return parseAnnotations(text);
}

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function analyzeImage(imageBase64: string, mimeType: string): Promise<SpaceAnnotations> {
  if (!hasGeminiApiKey()) {
    return { ...DEMO_ANNOTATIONS };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  let lastError: unknown;

  for (const modelName of MODEL_PRIORITY) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[Gemini] Trying model=${modelName} attempt=${attempt + 1}`);
        const result = await tryModel(genAI, modelName, imageBase64, mimeType);
        console.log(`[Gemini] Success with model=${modelName}`);
        return result;
      } catch (error) {
        lastError = error;

        if (isRateLimitError(error)) {
          if (attempt < MAX_RETRIES - 1) {
            const backoffMs = 2000 * Math.pow(2, attempt);
            console.warn(`[Gemini] Rate limited on ${modelName}, backing off ${backoffMs}ms`);
            await sleep(backoffMs);
            continue;
          } else {
            console.warn(`[Gemini] Exhausted retries on ${modelName}, trying next model`);
            break;
          }
        }

        // Non-rate-limit error (404, parse failure, etc): skip to next model
        console.warn(`[Gemini] Error on ${modelName}:`, (error as Error).message);
        break;
      }
    }
  }

  if (isRateLimitError(lastError)) {
    throw new Error(
      "Gemini API quota exceeded. Please wait a moment and try again, or check your quota at https://aistudio.google.com",
    );
  }

  const msg = lastError instanceof Error ? lastError.message : "All Gemini models failed";
  throw new Error(msg);
}

export function extractBase64FromDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  return { mimeType: match[1], data: match[2] };
}
