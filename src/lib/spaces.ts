import type { AnalysisStatus, SpaceAnnotations, SpaceRecord } from "./types";
import { isSpaceAnnotations } from "./types";

type PrismaSpace = {
  id: string;
  imageUrl: string;
  status: AnalysisStatus;
  annotations: unknown;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaSpaceLite = Omit<PrismaSpace, "imageUrl">;

export const STALE_PROCESSING_MS = 90_000;

export function isStaleProcessing(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() > STALE_PROCESSING_MS;
}

export function toSpaceRecord(space: PrismaSpace): SpaceRecord {
  return {
    id: space.id,
    imageUrl: space.imageUrl,
    status: space.status,
    annotations: parseAnnotations(space.annotations),
    errorMessage: space.errorMessage,
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString(),
  };
}

export function toSpaceStatusRecord(space: PrismaSpaceLite): SpaceRecord {
  return {
    id: space.id,
    imageUrl: "",
    status: space.status,
    annotations: parseAnnotations(space.annotations),
    errorMessage: space.errorMessage,
    createdAt: space.createdAt.toISOString(),
    updatedAt: space.updatedAt.toISOString(),
  };
}

function parseAnnotations(value: unknown): SpaceAnnotations | null {
  if (value && isSpaceAnnotations(value)) {
    return value;
  }
  return null;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const spaceStatusSelect = {
  id: true,
  status: true,
  annotations: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;
