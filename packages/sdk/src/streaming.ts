export interface StreamChunk {
  id: string;
  data: unknown;
  timestamp: number;
}

export interface StreamOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class StreamBuffer {
  private chunks: StreamChunk[] = [];
  private closed = false;

  push(chunk: unknown): string {
    if (this.closed) {
      throw new Error('Stream is closed');
    }
    const id = `chunk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.chunks.push({ id, data: chunk, timestamp: Date.now() });
    return id;
  }

  close(): void {
    this.closed = true;
  }

  getAll(): StreamChunk[] {
    return [...this.chunks];
  }

  toJSON(): string {
    return JSON.stringify(this.chunks);
  }
}

export async function streamPipeline<T, R>(
  source: AsyncIterable<T>,
  transformer: (item: T) => R,
  options: StreamOptions = {}
): Promise<void> {
  try {
    for await (const item of source) {
      const result = transformer(item);
      const chunk: StreamChunk = {
        id: `chunk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        data: result,
        timestamp: Date.now(),
      };
      options.onChunk?.(chunk);
    }
    options.onComplete?.();
  } catch (error) {
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function* asyncGenerator<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}
