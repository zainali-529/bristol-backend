const config = require('../config/config');

const store = new Map();

const rateLimiter = (keyExtractor = (req) => req.ip) => {
  const windowMs = config.RATE_LIMIT_WINDOW_MS || 60 * 1000;
  const max = config.RATE_LIMIT_MAX_REQUESTS || 10;

  return (req, res, next) => {
    const key = keyExtractor(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = store.get(key) || [];
    const recent = record.filter((ts) => ts > windowStart);
    recent.push(now);
    store.set(key, recent);

    if (recent.length > max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }
    next();
  };
};

module.exports = { rateLimiter };

