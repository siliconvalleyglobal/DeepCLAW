export interface ApiErrorPayload {
  code: number;
  message: string;
  requestId?: string;
}

export interface StandardErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly capacity = 100;
  private readonly refillRate = 100 / 60;

  check(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let bucket = this.buckets.get(ip);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(ip, bucket);
    }

    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true };
    }

    const retryAfter = Math.max(1, Math.ceil((1 - bucket.tokens) / this.refillRate));
    return { allowed: false, retryAfter };
  }
}

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;
}

export function requestIdMiddleware(c: any, next: () => Promise<void>) {
  const requestId = generateRequestId();
  c.set('requestId', requestId);
  c.res.headers.set('X-Request-ID', requestId);
  return next();
}

export function securityHeaders(c: any, next: () => Promise<void>) {
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Content-Security-Policy', "default-src 'self'");
  return next();
}

export function requestLogger(c: any, next: () => Promise<Response>) {
  const start = Date.now();
  return next().then((response) => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: c.req.method,
      path: c.req.path,
      status: response.status,
      requestId: c.get('requestId'),
      durationMs: duration,
    }));
    return response;
  });
}

export function rateLimitMiddleware(limiter: RateLimiter) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const result = limiter.check(ip);
    if (!result.allowed) {
      c.res.headers.set('Retry-After', String(result.retryAfter));
      return c.json({
        success: false,
        error: {
          code: 429,
          message: 'Too many requests',
          requestId: c.get('requestId'),
        },
      }, 429);
    }
    return await next();
  };
}
