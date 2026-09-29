import { ApiError } from './errors';

export interface SseParseOptions {
  signal?: AbortSignal;
}

/** Parse an SSE response, preserving event order and tolerating EOF without [DONE]. */
export async function* parseSseStream<T>(response: Response, options: SseParseOptions = {}): AsyncGenerator<T> {
  if (!response.ok) throw new ApiError(`SSE request failed (${response.status})`, response.status);
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines: string[] = [];

  const emit = (): T | undefined => {
    if (dataLines.length === 0) return undefined;
    const data = dataLines.join('\n').trim();
    dataLines = [];
    if (!data || data === '[DONE]') return undefined;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new ApiError('SSE response chứa dữ liệu không hợp lệ.', response.status, error);
    }
  };

  try {
    while (true) {
      if (options.signal?.aborted) {
        await reader.cancel();
        return;
      }
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line === '') {
          const event = emit();
          if (event !== undefined) yield event;
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (done) break;
    }
    if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).trimStart());
    const event = emit();
    if (event !== undefined) yield event;
  } catch (error) {
    if (options.signal?.aborted) return;
    throw error;
  } finally {
    reader.releaseLock();
  }
}
