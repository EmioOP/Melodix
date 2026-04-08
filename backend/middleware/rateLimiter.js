// ─── Rate Limiter Middleware ───────────────────────────────────────────────────
// Protects the YouTube search endpoint from quota exhaustion.
// Each authenticated user is limited to 15 searches per minute.
// Unauthenticated users are limited by IP (fallback).

const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    // ✅ Authenticated user → use user ID
    if (req.user?._id || req.user?.id) {
      return req.user._id?.toString() || req.user.id.toString();
    }

    // ✅ Unauthenticated → safe IP handling
    return ipKeyGenerator(req);
  },

  handler: (req, res) => {
    console.warn(`[RateLimit] User ${req.user?._id || req.ip} hit search limit`);

    return res.status(429).json({
      message: "Too many searches. Please wait a moment before searching again.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

module.exports = { searchLimiter };
