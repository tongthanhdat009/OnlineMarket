export interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;
  readonly code?: string;

  constructor(message: string, status = 0, details?: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

function messageFromPayload(payload: unknown): string | undefined {
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ['Message', 'message', 'error', 'Error', 'title', 'Title']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizeError(error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'): NormalizedError {
  if (error instanceof ApiError) {
    return {
      message: error.message || fallback,
      status: error.status || undefined,
      code: error.code,
      details: error.details,
    };
  }
  if (error instanceof Error) return { message: error.message || fallback };
  const payloadMessage = messageFromPayload(error);
  return { message: payloadMessage ?? fallback, details: error };
}

export function errorMessage(error: unknown, fallback?: string): string {
  return normalizeError(error, fallback).message;
}
