import { GoogleGenerativeAI } from "@google/generative-ai";
import { isSpaceAnnotations, type SpaceAnnotations } from "./types";

const GEMINI_TIMEOUT_MS = 30_000;

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

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function analyzeImage(imageBase64: string, mimeType: string): Promise<SpaceAnnotations> {
  if (!hasGeminiApiKey()) {
    return { ...DEMO_ANNOTATIONS };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

export function extractBase64FromDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL");
  }
  return { mimeType: match[1], data: match[2] };
}
