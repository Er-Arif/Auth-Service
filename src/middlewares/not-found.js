const { errorResponse } = require('../utils/response');

function notFoundHandler(req, res) {
  res.status(404).json(
    errorResponse({
      message: 'Resource not found',
      errors: [
        {
          code: 'RESOURCE_NOT_FOUND',
        },
      ],
    }),
  );
}

module.exports = { notFoundHandler };
