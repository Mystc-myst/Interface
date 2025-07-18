/**
 * @module errors
 * @description Defines custom error classes for the application.
 */

/**
 * @class NotFoundError
 * @extends Error
 * @description Represents a "not found" error.
 */
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * @class DatabaseError
 * @extends Error
 * @description Represents a database-related error.
 */
class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
  }
}

module.exports = {
  NotFoundError,
  DatabaseError
};
