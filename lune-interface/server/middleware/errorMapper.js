const { NotFoundError, DatabaseError } = require('../errors');

module.exports = function errorMapper(err, req, res, next) {
  if (err instanceof NotFoundError) {
    err.statusCode = 404;
  } else if (err instanceof DatabaseError) {
    err.statusCode = 500;
  }
  next(err);
};
