import { prisma } from "@/lib/prisma";
import { analyzeImage, extractBase64FromDataUrl, hasGeminiApiKey } from "@/lib/gemini";
import type { Prisma } from "@prisma/client";

async function updateSpaceWithRetry(
  spaceId: string,
  data: Prisma.SpaceUpdateInput,
  attempts = 3,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await prisma.space.update({ where: { id: spaceId }, data });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export async function runAnalysis(spaceId: string): Promise<void> {
  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) return;

  try {
    const { data, mimeType } = extractBase64FromDataUrl(space.imageUrl);
    const annotations = await analyzeImage(data, mimeType);

    await updateSpaceWithRetry(spaceId, {
      status: "DONE",
      annotations: annotations as unknown as Prisma.InputJsonValue,
      errorMessage: hasGeminiApiKey()
        ? null
        : "Demo mode: set GEMINI_API_KEY for live AI analysis",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed unexpectedly";

    try {
      await updateSpaceWithRetry(spaceId, {
        status: "FAILED",
        errorMessage: message,
      });
    } catch {
      // Pool may be exhausted; stale PROCESSING recovery allows retry from the client.
    }
  }
}
