import rateLimit from "express-rate-limit";

// Strips Mongo operator keys ($gt, $where, ...) and dotted-path keys from
// user input, in place. We write this ourselves instead of pulling in
// express-mongo-sanitize because that package tries to *reassign*
// req.query, which is a getter-only property in Express 5 and throws.
function stripBadKeys(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === "object") {
      stripBadKeys(obj[key]);
    }
  }
  return obj;
}

export const sanitizeInput = (req, res, next) => {
  if (req.body) stripBadKeys(req.body);
  if (req.params) stripBadKeys(req.params);
  // req.query is intentionally left alone on Express 5 (read-only getter) —
  // route handlers here use params/body for identifiers, not raw query
  // filters, so this does not weaken protection in practice.
  next();
};

// Generous general API limiter — mainly a backstop against scripted abuse.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down and try again shortly." },
});

// Tight limiter for auth endpoints (login/signup/OTP) to blunt credential
// stuffing and brute-force attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});
