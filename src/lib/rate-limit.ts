interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export const checkRateLimit = (ip: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "5", 10);

  if (!store[ip]) {
    store[ip] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const record = store[ip];

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
};

// Limpiar entries expiradas cada hora
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((ip) => {
    if (now > store[ip].resetTime) {
      delete store[ip];
    }
  });
}, 3600000);
