const rateLimit = require('express-rate-limit');

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

const authLimiter = isDevOrTest 
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    });

const apiLimiter = isDevOrTest
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    });

module.exports = { authLimiter, apiLimiter };

