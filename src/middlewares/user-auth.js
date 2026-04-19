const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/errors');

function userAuth(req, res, next) {
  try {
    const headers = req.validated?.headers || req.headers;
    const authorization = headers.authorization || headers.Authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError({
        statusCode: 401,
        message: 'Invalid access token',
        errors: [{ code: 'ACCESS_TOKEN_INVALID' }],
      });
    }

    const token = authorization.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (req.appContext && payload.app_id !== req.appContext.app.appId) {
      throw new AppError({
        statusCode: 401,
        message: 'Invalid access token',
        errors: [{ code: 'ACCESS_TOKEN_INVALID' }],
      });
    }

    req.auth = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError({
          statusCode: 401,
          message: 'Access token expired',
          errors: [{ code: 'ACCESS_TOKEN_EXPIRED' }],
        }),
      );
    }

    return next(
      error instanceof AppError
        ? error
        : new AppError({
            statusCode: 401,
            message: 'Invalid access token',
            errors: [{ code: 'ACCESS_TOKEN_INVALID' }],
          }),
    );
  }
}

module.exports = { userAuth };
