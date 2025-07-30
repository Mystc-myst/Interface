const { NotFoundError, DatabaseError } = require('../errors');

function errorMapper(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  if (err instanceof DatabaseError) {
    return res.status(500).json({ error: err.message });
  }
  next(err);
}

module.exports = errorMapper;
