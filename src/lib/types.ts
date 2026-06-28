export type AnalysisStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface SpaceAnnotations {
  roomType: string;
  furniture: string[];
  materials: string[];
  lightingStyle: string;
  colorPalette: string[];
}

export interface SpaceRecord {
  id: string;
  imageUrl: string;
  status: AnalysisStatus;
  annotations: SpaceAnnotations | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isSpaceAnnotations(value: unknown): value is SpaceAnnotations {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.roomType === "string" &&
    Array.isArray(obj.furniture) &&
    Array.isArray(obj.materials) &&
    typeof obj.lightingStyle === "string" &&
    Array.isArray(obj.colorPalette)
  );
}

export function getTopTags(annotations: SpaceAnnotations | null, limit = 3): string[] {
  if (!annotations) return [];
  const tags = [
    annotations.roomType,
    ...annotations.furniture.slice(0, 2),
    ...annotations.materials.slice(0, 1),
    annotations.lightingStyle,
    ...annotations.colorPalette.slice(0, 2),
  ].filter(Boolean);
  return [...new Set(tags)].slice(0, limit);
}
