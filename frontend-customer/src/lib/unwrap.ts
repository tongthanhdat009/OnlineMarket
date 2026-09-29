/** Handles ASP.NET anonymous response wrappers without changing transport casing. */
export function unwrapData<T>(payload: T | { data?: T; Data?: T }): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if ('data' in record) return record.data as T;
    if ('Data' in record) return record.Data as T;
  }
  return payload as T;
}

export function getResponseMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  const message = record.Message ?? record.message;
  return typeof message === 'string' ? message : undefined;
}
